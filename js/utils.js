(function () {
  const utils = {
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    deepClone(value) {
      return JSON.parse(JSON.stringify(value));
    },

    mergeEffects(target, source) {
      Object.entries(source || {}).forEach(([key, value]) => {
        target[key] = (target[key] || 0) + value;
      });
    },

    pairKey(ids) {
      return [...ids].sort().join("::");
    },

    formatEffectSummary(effects) {
      const summary = [];
      const mapping = {
        containment: "収容",
        secrecy: "秘匿",
        truth: "真実",
        recognition: "認識",
        memory: "記憶",
        contamination: "汚染",
        obsession: "執着",
        ethics: "倫理",
        evaluation: "評価",
        casualties: "人的損失",
      };

      Object.entries(effects).forEach(([key, value]) => {
        if (!value) {
          return;
        }
        const prefix = value > 0 ? "+" : "";
        summary.push(`${mapping[key]} ${prefix}${value}`);
      });

      return summary.length ? summary : ["変動なし"];
    },

    makeLogEntry(message) {
      return {
        time: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message,
      };
    },

    escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    },

    hashString(value) {
      let hash = 0;
      for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
      }
      return hash;
    },

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    escapeHtmlAttribute(value) {
      return utils.escapeHtml(value).replace(/"/g, "&quot;");
    },
  };

  window.ArchiveDriftUtils = utils;
})();
