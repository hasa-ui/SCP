# Review task
- [x] Start review of commit 4f07c8276a6fb2757d19c60d52608352f6a38c69
- [ ] Inspect commit diff and impacted files
- [ ] Validate suspected issues against surrounding code/tests
- [ ] Summarize findings in required JSON format

## Progress log
- 2026-03-21T14:23:52Z Started review
- [x] Inspect commit diff and impacted files
- [x] Validate suspected issues against surrounding code/tests
- [x] Summarize findings in required JSON format

## Review log
- $(date -u +%FT%TZ) Inspected diff for app.js, js/game-engine.js, js/renderers.js, js/ending-engine.js, styles.css.
- $(date -u +%FT%TZ) Verified syntax and game-data validation via node --check / scripts/validate-game-data.mjs.
- $(date -u +%FT%TZ) Checked ending reachability heuristically; no deterministic regression identified.

---

# Perf Task: lightweight runtime
- [x] 性能ボトルネック候補を確認する
- [x] セーブ処理をバッファ保存へ変更する
- [x] 比較差分と本文加工のキャッシュを追加する
- [x] render 用派生データを集約し、重複計算を減らす
- [x] 計測表示と回帰検証を追加する

## Progress log
- 2026-03-29: `saveState()` の同期連打、`buildDiffRows()` の DP 再計算、render 中の派生データ重複計算を主要な軽量化対象として整理。
- 2026-03-29: `js/save-manager.js` にデバウンス保存、flush、保存計測を追加し、`js/game-engine.js` で重要操作だけ即時保存に切り替えた。
- 2026-03-29: `js/corruption-engine.js` に本文/差分キャッシュを追加し、`js/renderers.js` は `buildRenderModel()` と Debug 計測表示を使う構成へ変更した。

## Verification log
- 2026-03-29: `node --check app.js` 成功
- 2026-03-29: `node --check js/save-manager.js` 成功
- 2026-03-29: `node --check js/corruption-engine.js` 成功
- 2026-03-29: `node --check js/game-engine.js` 成功
- 2026-03-29: `node --check js/renderers.js` 成功
- 2026-03-29: `node scripts/validate-game-data.mjs` 成功 (`Game data validation passed.`)
- 2026-03-29: `node /tmp/linkedom/verify-phase1-browser.mjs` 成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)
- 2026-03-29: linkedom でメモ入力直後は保存されず、約350ms後に保存されることを確認 (`DEBOUNCED_SAVE_OK`)
- 2026-03-29: 本文/差分キャッシュの hit が増えることを確認 (`CACHE_HIT_OK`)
- 2026-03-29: Playwright client 実行は `browser.newPage: Target page, context or browser has been closed` で失敗

## Follow-up log
- 2026-03-29: review 指摘に対応し、遅延保存タイマー完了時の再描画フックを `save-manager` に追加。`app.js` からそのフックで warning banner を更新するよう修正。
- 2026-03-29: `computeApprovalChecklist()` の比較済み判定を、推奨比較ヒントではなく実際の `comparePairsViewed` と揃えるよう修正。

## Follow-up verification
- 2026-03-29: `node --check app.js` 成功
- 2026-03-29: `node --check js/save-manager.js` 成功
- 2026-03-29: `node --check js/game-engine.js` 成功
- 2026-03-29: `node /tmp/linkedom/verify-phase1-browser.mjs` 再実行成功 (`DEBUG_MODE_OK`, `SAVE_MIGRATION_OK`, `FULL_PLAYTHROUGH_OK`)
- 2026-03-29: linkedom で遅延 autosave 失敗後に warning banner が再描画されることを確認 (`ASYNC_SAVE_WARNING_RENDER_OK`)
- 2026-03-29: 非推奨ペア比較でもチェックリストと描画結果が `比較履歴あり` になることを確認 (`CHECKLIST_COMPARE_RULE_OK`)
