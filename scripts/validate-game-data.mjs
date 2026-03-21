import fs from "node:fs";
import vm from "node:vm";

const window = { window: null };
window.window = window;

vm.runInNewContext(fs.readFileSync(new URL("../js/utils.js", import.meta.url), "utf8"), window);
vm.runInNewContext(fs.readFileSync(new URL("../js/data-tools.js", import.meta.url), "utf8"), window);
vm.runInNewContext(fs.readFileSync(new URL("../game-data.js", import.meta.url), "utf8"), window);

const rawData = window.RAW_GAME_DATA || window.GAME_DATA;
const gameData = window.ArchiveDriftDataTools.normalizeGameData(rawData);
const report = window.ArchiveDriftDataTools.buildValidationReport(gameData);

if (report.errors.length) {
  console.error("Game data validation failed.");
  report.errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log("Game data validation passed.");
if (report.warnings.length) {
  report.warnings.forEach((warning) => console.log(`WARN: ${warning}`));
}
