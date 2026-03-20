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
