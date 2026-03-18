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

## Verification Log
- 2026-03-18: `node --check app.js` -> 成功
- 2026-03-18: `node --check game-data.js` -> 成功
- 2026-03-18: `node /tmp/linkedom/test-run.mjs` -> 成功
- 2026-03-18: `node /tmp/linkedom/test-run.mjs` の結果: 8案件を自動周回し、`ENDING:真実保存エンド` / `SIMULATION_OK` を確認
- 2026-03-18: `python3 -m http.server 8123` + `curl -I http://127.0.0.1:8123/index.html` -> `HTTP/1.0 200 OK`
