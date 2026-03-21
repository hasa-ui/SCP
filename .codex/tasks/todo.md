# Phase1 Task

## Plan
- [x] `ROADMAP.md` を確認し、Phase1 の完了条件を抽出する
- [x] 現行 `app.js` の責務を棚卸しし、分割方針を決める
- [x] セーブ管理を独立し、バージョン管理とマイグレーションを強化する
- [x] 描画・案件進行・汚染演出・エンディング判定を分割する
- [x] 案件データ定義を整理する
- [x] データバリデーションを追加する
- [x] デバッグ表示モードを追加する
- [x] 回帰検証を実行する
- [x] `ROADMAP.md` に Phase1 完了を反映する

## Scope Notes
- 影響範囲は Phase1 に限定し、既存のゲームループとシナリオ挙動は維持する
- ビルド工程は増やさず、静的ブラウザ構成のまま責務分割する
- セーブ破損時の復旧性とデータ追加時の保守性を優先する

## Progress Log
- 2026-03-20: `ROADMAP.md` を確認。Phase1 の実装対象は `app.js` 分割、セーブ管理強化、データ整理、デバッグ表示、バリデーション追加。
- 2026-03-20: `app.js` をブートストラップ層へ縮小し、`js/` 配下へセーブ管理・描画・案件進行・汚染演出・エンディング判定を分割した。
- 2026-03-20: `game-data.js` を正規化前提の生データ定義へ整理し、`scripts/validate-game-data.mjs` で静的バリデーションを追加した。
- 2026-03-20: デバッグ表示モードとセーブデータ v2 マイグレーションを追加し、Phase1 の完了条件を満たしたため `ROADMAP.md` を更新した。

## Verification Log
- 2026-03-20: `node --check app.js` 成功
- 2026-03-20: `node --check js/utils.js && node --check js/data-tools.js && node --check js/save-manager.js && node --check js/corruption-engine.js && node --check js/ending-engine.js && node --check js/game-engine.js && node --check js/renderers.js` 成功
- 2026-03-20: `node scripts/validate-game-data.mjs` 成功 (`Game data validation passed.`)
- 2026-03-20: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)

---

# Review Task: d9d7d0db7c043101db0cb0eadc17712b52ac255e

## Plan
- [x] 変更差分と影響ファイルを確認する
- [x] 主要フロー（保存・進行・デバッグ）の回帰観点を点検する
- [x] 再現確認を実行して指摘候補を絞り込む

## Progress Log
- 2026-03-20: Phase 1 実装コミットの差分と新規モジュールを確認。
- 2026-03-20: セーブ移行処理とイベント制御を重点的に精査し、将来版セーブの扱いとゲーム終了後のデバッグ切替を確認。

## Verification Log
- 2026-03-20: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功
- 2026-03-20: 将来版セーブ (`version: 3`) を投入したブート再現で、未知形式を拒否せず v2 として上書きすることを確認
- 2026-03-20: フルプレイスルー後に `toggle-debug` を発火してもデバッグ表示が開かないことを確認

---

# Fix Task: future-save and post-ending debug

## Plan
- [x] 将来版セーブの読み込み経路を見直し、自動上書きを防ぐ
- [x] ゲーム終了後も `toggle-debug` だけは操作できるようにする
- [x] 回帰検証を実行し、ログを追記する

## Progress Log
- 2026-03-20: `js/save-manager.js` で `CURRENT_SAVE_VERSION` を超える保存データを `unsupported-version` として拒否し、初期化直後の自動保存をスキップする方針に変更。
- 2026-03-20: `app.js` のゲーム終了後クリックガードから `toggle-debug` を除外し、終幕後のデバッグ表示を許可。

## Verification Log
- 2026-03-20: `node --check app.js && node --check js/save-manager.js && node --check js/game-engine.js` 成功
- 2026-03-20: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)
- 2026-03-20: 将来版セーブ (`version: 3`) を投入したブート再現で、既存セーブが上書きされず `unsupported-version` 警告が表示されることを確認 (`FUTURE_SAVE_REJECT_OK`)
- 2026-03-20: `gameOver: true` の保存状態から `toggle-debug` を操作し、終幕後もデバッグ表示が開くことを確認 (`POST_ENDING_DEBUG_OK`)

---

# Review Task: 5bb67794bf20f659de020482a1ca59d029be58e7

## Plan
- [x] 変更差分と影響箇所を確認する
- [x] 変更された保存・デバッグ経路を再現確認する
- [x] 指摘候補を優先度付きで整理する

## Progress Log
- 2026-03-21: `app.js` / `js/game-engine.js` / `js/save-manager.js` の差分を確認し、将来版セーブ拒否とゲーム終了後デバッグ許可の実装を精査開始。

## Verification Log
- 2026-03-21: `git show --unified=80 5bb67794bf20f659de020482a1ca59d029be58e7` で差分と周辺文脈を確認

- 2026-03-21: 将来版セーブ (`version: 3`) を投入して起動し、初期表示では元セーブが保持される一方、`toggle-debug` の1回目操作で保存内容が v2 に上書きされることを再現。
- 2026-03-21: `node`+`linkedom` の再現で `INIT_VERSION=3`, `WARNING_VISIBLE=true`, `AFTER_CLICK_VERSION=2` を確認。

---

# Fix Task: future-save read-only session

## Plan
- [x] 将来版セーブ検出時にセッション全体を read-only 保存扱いにする
- [x] `new-game` / `reset-save` など明示操作では通常保存へ戻せるようにする
- [x] 再現ケースと既存スモークで回帰検証する

## Progress Log
- 2026-03-21: `js/game-engine.js` に `saveReadOnlySession` を追加し、互換外セーブ起動中の `persist()` を全面停止するよう変更。
- 2026-03-21: `new-game` / `reset-save` 実行時は read-only 状態を解除して、新しいローカル保存へ切り替えられるよう調整。

## Verification Log
- 2026-03-21: `node --check js/game-engine.js` 成功
- 2026-03-21: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)
- 2026-03-21: 将来版セーブ (`version: 3`) を投入して起動後に `toggle-debug` を実行しても、元セーブが保持されることを確認 (`FUTURE_SAVE_SESSION_READONLY_OK`)
- 2026-03-21: 将来版セーブ起動後でも `new-game` 実行時は現行版セーブへ切り替わることを確認 (`FUTURE_SAVE_NEW_GAME_UNLOCK_OK`)

---

# Phase2 Task

## Plan
- [x] `ROADMAP.md` の Phase2 タスクを確認し、実装項目へ分解する
- [x] チュートリアル導線と初回必読文書誘導を追加する
- [x] 比較対象の視認性向上と比較UIの改善を行う
- [x] 判断UIと承認前チェックの見やすさを改善する
- [x] 日次報告 / 処理ログ / エンディング表示を改善する
- [x] モバイル時レイアウトを最適化する
- [x] エンディング条件の納得感を調整する
- [x] 回帰検証を実行し、結果を記録する

## Scope Notes
- Phase1 で分割した責務構造は維持し、`renderers` と `game-engine` 中心に差分を閉じる
- セーブ互換への影響を避けるため、初回導線の状態管理は既存 `flags` を優先利用する
- UI 改修は静的ブラウザ構成のまま実装し、追加ビルド工程は導入しない

## Progress Log
- 2026-03-21: `ROADMAP.md` を確認。Phase2 の対象はチュートリアル導線、必読文書誘導、比較/判断UI改善、モバイル最適化、日次報告/ログ/エンディング改善、エンディング条件調整。
- 2026-03-21: `js/game-engine.js` に必読文書、比較候補、承認前チェック、初回チュートリアル用の表示ヘルパーと操作を追加した。
- 2026-03-21: `js/renderers.js` と `styles.css` を更新し、初回導線、比較候補カード、強化差分表示、承認前チェック、ログ分類、日次報告/終幕表示、モバイル時のカラム順最適化を実装した。
- 2026-03-21: `js/ending-engine.js` の終幕条件を再調整し、終幕ごとの総括と判定根拠を表示できるようにした。
- 2026-03-21: `ROADMAP.md` の Phase2 セクションを完了状態へ更新し、実施結果を反映した。

## Verification Log
- 2026-03-21: `node --check app.js` 成功
- 2026-03-21: `node --check js/game-engine.js` 成功
- 2026-03-21: `node --check js/renderers.js` 成功
- 2026-03-21: `node --check js/ending-engine.js` 成功
- 2026-03-21: `node scripts/validate-game-data.mjs` 成功 (`Game data validation passed.`)
- 2026-03-21: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)
- 2026-03-21: Day1 起動時の DOM 検証で、初回プレイガイド / 必読文書誘導 / おすすめ比較 / 承認前チェックの表示を確認 (`PHASE2_DAY1_UI_OK`)
- 2026-03-21: 8案件の通しプレイで、日次報告に採用解釈/方針が表示され、終幕に総括と根拠が表示されることを確認 (`PHASE2_REPORT_ENDING_OK`)
