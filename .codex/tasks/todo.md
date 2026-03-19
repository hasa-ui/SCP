# MVP Implementation Todo

## Plan
- [x] 仕様書を確認し、MVP範囲を抽出する
- [x] 静的ブラウザ構成を作成する
- [x] ケースデータと分岐ロジックを実装する
- [x] 文書閲覧・比較・編集UIを実装する
- [x] 日次進行・ステータス・エンディング・セーブを実装する
- [x] ローカルで動作検証し、結果を記録する

## Scope Notes
- 依存を増やさず HTML / CSS / JavaScript の静的構成で実装する
- ケースはデータ駆動で管理し、MVPの主要導線を一通り通せる状態を目標にする
- 文書編集は伏字化・注釈追加・承認を案件結果へ反映する簡易仕様にする

## Progress Log
- 2026-03-18: 仕様書と AGENTS.md を確認。空リポジトリのため、ゼロから静的ブラウザMVPを構築する方針に決定。
- 2026-03-18: `index.html` / `styles.css` / `game-data.js` / `app.js` を追加。3カラムUI、8案件、文書比較、伏字・注釈・承認、日次進行、ローカルセーブ、エンディング判定を実装。
- 2026-03-18: `README.md` を更新し、起動方法とMVP実装範囲を追記。
- 2026-03-18: レビュー指摘3件に対応するため `app.js` を修正。`localStorage` 例外時のメモリ実行フォールバック、`canonicalFalseArchive` 優先、安定条件を満たさない場合の `偽安定エンド` を追加。
- 2026-03-19: ストレージ回復回りを再修正。`破損JSON` と `保存不可` を分離し、`reset-save` が一時的な `setItem()` 失敗後でも旧セーブを day 1 の新規状態へ置き換えられるようにした。

## Verification Log
- 2026-03-18: `node --check app.js` -> 成功
- 2026-03-18: `node --check game-data.js` -> 成功
- 2026-03-18: `node /tmp/linkedom/test-run.mjs` -> 成功
- 2026-03-18: `node /tmp/linkedom/test-run.mjs` の結果: 8案件を自動周回し、`ENDING:真実保存エンド` / `SIMULATION_OK` を確認
- 2026-03-18: `python3 -m http.server 8123` + `curl -I http://127.0.0.1:8123/index.html` -> `HTTP/1.0 200 OK`
- 2026-03-18: 修正後 `node --check app.js` -> 成功
- 2026-03-18: `node /tmp/linkedom/verify-review-fixes.mjs` -> `CANONICAL_FALSE_OK` / `STORAGE_FALLBACK_OK` / `UNSTABLE_FALLBACK_OK`
- 2026-03-19: `node --check app.js` -> 成功
- 2026-03-19: `node /tmp/linkedom/verify-storage-recovery.mjs` -> `CORRUPTED_SAVE_RECOVERY_OK` / `RESET_AFTER_WRITE_FAILURE_OK`
- 2026-03-19: `node /tmp/linkedom/verify-review-fixes.mjs` -> `CANONICAL_FALSE_OK` / `STORAGE_FALLBACK_OK` / `UNSTABLE_FALLBACK_OK`

## Review Plan (2026-03-18)
- [x] 対象コミットと作業ツリーを確認する
- [x] 差分と主要ロジックを精読する
- [x] 疑わしい挙動を再現・検証する
- [x] レビュー結果と検証ログをまとめる

## Review Progress Log
- 2026-03-18: レビュー開始。対象コミット `925849aca62f5b0d9d266afcb9abb449f5630bc5` が HEAD であることを確認。
- 2026-03-18: `node` + linkedom で最適寄り周回を再現し、最終案件で `construct-canonical-false` を選んでも `canonicalFalseArchive` フラグ付きのまま `真実保存エンド` になることを確認。
- 2026-03-18: `node` + linkedom で `localStorage` が例外を投げる環境を再現し、`DOMContentLoaded` 時に `saveState()` 経由で初期化が `INIT_FAILED:storage disabled` になることを確認。
- 2026-03-18: `node` + linkedom で各日3番目の解釈/判断を選ぶ周回を再現し、`containment=51` / `casualties=1` でも `模範的財団エンド` になることを確認。

## Review Verification Log
- 2026-03-18: `node` + linkedom シミュレーション（case-8 だけ `construct-canonical-false`） -> `canonicalFalseArchive` フラグ付きでも `ending.id = truth`
- 2026-03-18: `node` + linkedom シミュレーション（`localStorage` が常に例外） -> `INIT_FAILED:storage disabled`
- 2026-03-18: `node` + linkedom シミュレーション（毎日3番目の選択肢） -> `ending.id = foundation`, `site.containment = 51`, `site.casualties = 1`

## Review Plan (2026-03-19)
- [x] 対象コミット `6aebbb40f106ace30b2c4f421784a40db0376c2f` の差分を確認する
- [x] 保存処理とエンディング判定の回帰有無を検証する
- [x] 再現結果を根拠つきでレビュー所見に整理する

## Review Progress Log
- 2026-03-19: レビュー開始。対象コミット `6aebbb40f106ace30b2c4f421784a40db0376c2f` が HEAD であること、差分が `app.js` と `.codex/tasks/todo.md` に限られることを確認。
- 2026-03-19: `loadState()` の例外処理が `JSON.parse()` 失敗時にも `storageAvailable=false` を立てるため、壊れた保存データがあるだけで永続保存を完全停止することを確認。
- 2026-03-19: `saveState()` の一時失敗後に `clearSavedState()` が短絡し、既存セーブを削除できずリロード後に古い進行が復活することを確認。

## Review Verification Log
- 2026-03-19: `node` + linkedom（保存値を `{broken json` に破損） -> 初期化後も `localStorage` 自体は利用可能なのに `セーブ警告` 表示、`reset-save` 実行後も保存値が `{broken json` のまま残存
- 2026-03-19: `node` + linkedom（一度だけ `localStorage.setItem()` を失敗させた後に `reset-save` 実行） -> 既存の day-4 セーブが削除されず、再読込で旧進行が復活
