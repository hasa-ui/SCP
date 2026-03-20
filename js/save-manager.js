(function () {
  const utils = window.ArchiveDriftUtils;
  const dataTools = window.ArchiveDriftDataTools;

  function createSaveManager(options = {}) {
    const saveKey = options.saveKey || "scp-archive-drift-mvp-v2";
    let storageWarningReason = "";

    function createInitialState(gameData, initOptions = {}) {
      const warningReason = initOptions.warningReason || storageWarningReason || "";
      return {
        version: dataTools.CURRENT_SAVE_VERSION,
        saveMeta: {
          version: dataTools.CURRENT_SAVE_VERSION,
          migratedFrom: initOptions.migratedFrom || null,
          lastSavedAt: null,
        },
        player: utils.deepClone(gameData.initialPlayer),
        site: utils.deepClone(gameData.initialSite),
        flags: [],
        currentCaseIndex: 0,
        currentView: {
          mode: "document",
          currentDocId: gameData.cases[0]?.documents[0]?.id || "",
          compareIds: ["", ""],
        },
        completedCaseIds: [],
        caseProgress: dataTools.buildInitialCaseProgress(gameData),
        reports: [],
        logs: [
          utils.makeLogEntry("配属完了。記録整合管理局の当直が開始された。"),
          utils.makeLogEntry("初期権限は CL-2。案件の整合確認と採用判断を担当する。"),
        ],
        storageWarning: Boolean(warningReason),
        storageWarningReason: warningReason,
        overlay: null,
        gameOver: false,
        ending: null,
        debug: {
          enabled: Boolean(initOptions.debugEnabled),
        },
      };
    }

    function loadState(gameData) {
      let raw = null;
      try {
        raw = localStorage.getItem(saveKey);
      } catch (error) {
        storageWarningReason = "unavailable";
        return { state: null, warningReason: "unavailable", skipInitialSave: false };
      }

      if (!raw) {
        storageWarningReason = "";
        return { state: null, warningReason: "", skipInitialSave: false };
      }

      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        storageWarningReason = "corrupted";
        return { state: null, warningReason: "corrupted", skipInitialSave: false };
      }

      const parsedVersion = Number(parsed.version || 1);
      if (parsedVersion > dataTools.CURRENT_SAVE_VERSION) {
        storageWarningReason = "unsupported-version";
        return {
          state: null,
          warningReason: "unsupported-version",
          skipInitialSave: true,
        };
      }

      const migrated = migrateLoadedState(parsed, gameData);
      storageWarningReason = "";
      migrated.storageWarning = false;
      migrated.storageWarningReason = "";
      return {
        state: migrated,
        warningReason: "",
        skipInitialSave: false,
      };
    }

    function migrateLoadedState(state, gameData) {
      const originalVersion = Number(state.version || 1);
      let migrated = utils.deepClone(state);

      if (originalVersion < 2) {
        migrated = migrateV1ToV2(migrated, gameData);
      }

      return normalizeLoadedState(migrated, gameData, originalVersion < 2 ? originalVersion : null);
    }

    function migrateV1ToV2(state, gameData) {
      return {
        ...state,
        version: 2,
        saveMeta: {
          version: 2,
          migratedFrom: 1,
          lastSavedAt: null,
        },
        storageWarning: false,
        storageWarningReason: "",
        debug: {
          enabled: Boolean(state.debug?.enabled),
        },
        caseProgress: normalizeCaseProgress(state.caseProgress, gameData),
      };
    }

    function normalizeLoadedState(state, gameData, migratedFrom) {
      return {
        version: dataTools.CURRENT_SAVE_VERSION,
        saveMeta: {
          version: dataTools.CURRENT_SAVE_VERSION,
          migratedFrom,
          lastSavedAt: state.saveMeta?.lastSavedAt || null,
        },
        player: {
          ...utils.deepClone(gameData.initialPlayer),
          ...(state.player || {}),
        },
        site: {
          ...utils.deepClone(gameData.initialSite),
          ...(state.site || {}),
        },
        flags: Array.isArray(state.flags) ? state.flags : [],
        currentCaseIndex: utils.clamp(
          Number.isInteger(state.currentCaseIndex) ? state.currentCaseIndex : 0,
          0,
          Math.max(gameData.cases.length - 1, 0)
        ),
        currentView: {
          mode: state.currentView?.mode === "compare" ? "compare" : "document",
          currentDocId: state.currentView?.currentDocId || gameData.cases[0]?.documents[0]?.id || "",
          compareIds: Array.isArray(state.currentView?.compareIds)
            ? [...state.currentView.compareIds.slice(0, 2), "", ""].slice(0, 2)
            : ["", ""],
        },
        completedCaseIds: Array.isArray(state.completedCaseIds) ? state.completedCaseIds : [],
        caseProgress: normalizeCaseProgress(state.caseProgress, gameData),
        reports: Array.isArray(state.reports) ? state.reports : [],
        logs: Array.isArray(state.logs) ? state.logs : [],
        storageWarning: false,
        storageWarningReason: "",
        overlay: state.overlay || null,
        gameOver: Boolean(state.gameOver),
        ending: state.ending || null,
        debug: {
          enabled: Boolean(state.debug?.enabled),
        },
      };
    }

    function normalizeCaseProgress(caseProgress, gameData) {
      const base = dataTools.buildInitialCaseProgress(gameData);
      Object.entries(base).forEach(([caseId, progress]) => {
        const loaded = caseProgress?.[caseId] || {};
        progress.readDocs = Array.isArray(loaded.readDocs) ? loaded.readDocs : [];
        progress.redactions = loaded.redactions || {};
        progress.annotationByDoc = loaded.annotationByDoc || {};
        progress.selectedInterpretationId = loaded.selectedInterpretationId || "";
        progress.selectedDecisionId = loaded.selectedDecisionId || "";
        progress.approved = Boolean(loaded.approved);
        progress.comparePairsViewed = Array.isArray(loaded.comparePairsViewed)
          ? loaded.comparePairsViewed
          : [];
        progress.outcomeSummary = loaded.outcomeSummary || "";
      });
      return base;
    }

    function saveState(state, saveOptions = {}) {
      const initialWarningReason = state.storageWarningReason || "";
      const shouldPreserveWarning = saveOptions.preserveWarning && Boolean(initialWarningReason);

      if (!shouldPreserveWarning) {
        clearStorageWarning(state);
      }

      try {
        const payload = buildSavePayload(state, shouldPreserveWarning);
        localStorage.setItem(saveKey, JSON.stringify(payload));
        state.saveMeta = payload.saveMeta;
        if (!shouldPreserveWarning) {
          clearStorageWarning(state);
        }
        return { success: true, warningReason: state.storageWarningReason || "" };
      } catch (error) {
        if (!shouldPreserveWarning || initialWarningReason === "corrupted") {
          setStorageWarning(state, "write-failed");
        }
        return { success: false, warningReason: state.storageWarningReason || "" };
      }
    }

    function clearSavedState(state) {
      try {
        localStorage.removeItem(saveKey);
        clearStorageWarning(state);
        return { success: true, warningReason: "" };
      } catch (error) {
        setStorageWarning(state, "unavailable");
        return { success: false, warningReason: state.storageWarningReason || "" };
      }
    }

    function setStorageWarning(state, reason) {
      storageWarningReason = reason;
      if (state) {
        state.storageWarning = true;
        state.storageWarningReason = reason;
      }
    }

    function clearStorageWarning(state) {
      storageWarningReason = "";
      if (state) {
        state.storageWarning = false;
        state.storageWarningReason = "";
      }
    }

    function buildSavePayload(state, clearWarningFields) {
      const payload = utils.deepClone(state);
      payload.version = dataTools.CURRENT_SAVE_VERSION;
      payload.saveMeta = {
        version: dataTools.CURRENT_SAVE_VERSION,
        migratedFrom: state.saveMeta?.migratedFrom || null,
        lastSavedAt: new Date().toISOString(),
      };
      if (clearWarningFields) {
        payload.storageWarning = false;
        payload.storageWarningReason = "";
      }
      return payload;
    }

    function getStorageWarningMessage(reason) {
      if (reason === "corrupted") {
        return "既存の保存データを読み込めませんでした。新しい進行で再開しています。";
      }
      if (reason === "unsupported-version") {
        return "この保存データは新しいバージョンで作成されています。現在の版では読み込まず、元の保存は保持したまま新しい進行で開始しています。";
      }
      if (reason === "write-failed") {
        return "最新の進行をローカル保存できませんでした。現在のタブを閉じると失われる可能性があります。";
      }
      return "この環境ではローカル保存を利用できません。進行は現在のタブ内でのみ保持されます。";
    }

    return {
      saveKey,
      currentVersion: dataTools.CURRENT_SAVE_VERSION,
      createInitialState,
      loadState,
      saveState,
      clearSavedState,
      getStorageWarningMessage,
    };
  }

  window.ArchiveDriftSaveManager = {
    createSaveManager,
  };
})();
