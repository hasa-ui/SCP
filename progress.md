Original prompt: 動作を軽量化するためにどのような変更を加えますか？ / Implement the plan.

- 2026-03-29: 保存頻度、比較差分再計算、render 時の派生データ重複計算を主要なホットパスとして確認。
- 2026-03-29: これから save debounce、corruption/diff cache、view model 集約、簡易パフォーマンス計測を実装する。
- 2026-03-29: `save-manager` にデバウンス保存と `flushPendingSave()`、保存計測を追加。controller は重要操作のみ即時保存に変更。
- 2026-03-29: `corruption-engine` に本文/差分キャッシュを追加し、`renderers` は `buildRenderModel()` を1回だけ使う構成へ寄せた。
- 2026-03-29: linkedom 検証で既存フロー、デバウンス保存、キャッシュヒットを確認。Playwright client は `browser.newPage: Target page, context or browser has been closed` で失敗。
