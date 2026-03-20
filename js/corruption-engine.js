(function () {
  const utils = window.ArchiveDriftUtils;

  function getPresentedText(doc, redactions, state, mode) {
    let text = doc.body;

    redactions.forEach((phrase) => {
      const token = "█".repeat(Math.max(4, phrase.length));
      text = text.replace(new RegExp(utils.escapeRegExp(phrase), "g"), token);
    });

    const dangerLevel =
      doc.dangerTags.some((tag) => tag.includes("災害") || tag.includes("侵食")) ||
      state.player.contamination >= 50;

    if (dangerLevel) {
      const replacements = [
        ["承認", "採用"],
        ["北経路", "南経路"],
        ["死亡", "継続"],
        ["保留", "確定"],
        ["未承認", "承認済み"],
      ];
      const pivot = utils.hashString(`${doc.id}:${state.player.dayCount}:${mode}`) % replacements.length;
      const [from, to] = replacements[pivot];
      text = text.replace(from, to);
    }

    if (state.player.recognition <= 40) {
      const parts = text.split("\n");
      if (parts.length > 2) {
        const index = utils.hashString(`${doc.id}:recognition`) % parts.length;
        parts.splice(index, 0, "[注: 前回閲覧時と同一内容であることを確認済み。]");
        text = parts.join("\n");
      }
    }

    if (state.player.contamination >= 68 && mode === "reader") {
      const paragraphs = text.split("\n\n");
      if (paragraphs.length > 2) {
        const first = paragraphs.shift();
        paragraphs.push(first);
        text = paragraphs.join("\n\n");
      }
    }

    if (state.player.memory <= 45 && mode === "compare") {
      text += "\n[比較注記欠損]";
    }

    return text;
  }

  function buildDiffRows(leftText, rightText) {
    const left = leftText.split("\n").filter(Boolean);
    const right = rightText.split("\n").filter(Boolean);
    const dp = Array.from({ length: left.length + 1 }, () =>
      Array(right.length + 1).fill(0)
    );

    for (let i = left.length - 1; i >= 0; i -= 1) {
      for (let j = right.length - 1; j >= 0; j -= 1) {
        if (left[i] === right[j]) {
          dp[i][j] = dp[i + 1][j + 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    const rows = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        rows.push({ left: left[i], right: right[j], changed: false });
        i += 1;
        j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        rows.push({ left: left[i], right: "", changed: true });
        i += 1;
      } else {
        rows.push({ left: "", right: right[j], changed: true });
        j += 1;
      }
    }

    while (i < left.length) {
      rows.push({ left: left[i], right: "", changed: true });
      i += 1;
    }

    while (j < right.length) {
      rows.push({ left: "", right: right[j], changed: true });
      j += 1;
    }

    return rows;
  }

  function getReaderWarnings(doc, state) {
    const warnings = [];

    if (doc.dangerTags.some((tag) => tag.includes("災害")) && state.player.contamination >= 40) {
      warnings.push("危険文書のため、再読時に本文の一部が変質して見える。");
    }

    if (state.player.memory <= 45) {
      warnings.push("記憶信頼度が低く、過去報告との一致判定が不安定。");
    }

    return warnings;
  }

  window.ArchiveDriftCorruptionEngine = {
    getPresentedText,
    buildDiffRows,
    getReaderWarnings,
  };
})();
