(function () {
  const SAVE_KEY = "scp-archive-drift-mvp-v1";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const dataTools = window.ArchiveDriftDataTools;
    const renderers = window.ArchiveDriftRenderers;
    const rawData = window.RAW_GAME_DATA || window.GAME_DATA;
    const gameData = dataTools.normalizeGameData(rawData);
    const validationReport = dataTools.buildValidationReport(gameData);

    window.GAME_DATA = gameData;

    if (validationReport.errors.length > 0) {
      renderers.renderFatalValidation(validationReport);
      return;
    }

    const saveManager = window.ArchiveDriftSaveManager.createSaveManager({
      saveKey: SAVE_KEY,
    });
    const controller = window.ArchiveDriftGameEngine.createGameController({
      gameData,
      saveManager,
      endingEngine: window.ArchiveDriftEndingEngine,
    });

    controller.init();
    bindEvents(controller, validationReport);
    renderers.renderApplication({
      controller,
      corruptionEngine: window.ArchiveDriftCorruptionEngine,
      validationReport,
    });
    controller.finalizeInitialRender();
  }

  function bindEvents(controller, validationReport) {
    const render = () => {
      window.ArchiveDriftRenderers.renderApplication({
        controller,
        corruptionEngine: window.ArchiveDriftCorruptionEngine,
        validationReport,
      });
    };

    document.addEventListener("click", (event) => {
      const actionNode = event.target.closest("[data-action]");
      if (!actionNode) {
        return;
      }

      const action = actionNode.dataset.action;
      const state = controller.getState();

      if (state.gameOver && !["new-game", "reset-save", "overlay-next", "toggle-debug"].includes(action)) {
        return;
      }

      switch (action) {
        case "new-game":
          if (window.confirm("現在の進行を破棄して新規周回を開始しますか。")) {
            controller.startNewGame();
            render();
          }
          return;
        case "reset-save":
          if (window.confirm("ローカルセーブを削除しますか。")) {
            controller.resetSave();
            render();
          }
          return;
        case "toggle-debug":
          controller.toggleDebugMode();
          render();
          return;
        case "dismiss-tutorial":
          controller.dismissTutorial();
          render();
          return;
        case "open-doc":
          controller.openDocument(actionNode.dataset.docId);
          render();
          return;
        case "apply-compare-hint":
          controller.setCompareHintSelection((actionNode.dataset.docIds || "").split("|"));
          render();
          return;
        case "toggle-redaction":
          controller.toggleRedaction(actionNode.dataset.docId, actionNode.dataset.phrase);
          render();
          return;
        case "save-annotation":
          controller.recordAnnotationCheckpoint();
          render();
          return;
        case "show-compare":
          controller.activateCompareView();
          render();
          return;
        case "back-to-document":
          controller.setViewMode("document");
          render();
          return;
        case "approve-case":
          controller.approveCurrentCase();
          render();
          return;
        case "end-day":
          controller.endCurrentDay();
          render();
          return;
        case "overlay-next":
          controller.dismissOverlay();
          render();
          return;
        default:
          return;
      }
    });

    document.addEventListener("change", (event) => {
      const target = event.target;
      const state = controller.getState();
      const caseData = controller.getCurrentCase();
      if (!caseData || state.gameOver) {
        return;
      }

      if (target.name === "interpretation") {
        controller.setInterpretation(target.value);
        render();
        return;
      }

      if (target.name === "decision") {
        controller.setDecision(target.value);
        render();
        return;
      }

      if (target.id === "compare-left") {
        controller.setCompareSelection(0, target.value || "");
        render();
        return;
      }

      if (target.id === "compare-right") {
        controller.setCompareSelection(1, target.value || "");
        render();
      }
    });

    document.addEventListener("input", (event) => {
      const target = event.target;
      const state = controller.getState();
      const caseData = controller.getCurrentCase();
      if (!caseData || state.gameOver) {
        return;
      }

      if (target.id === "annotation-input") {
        controller.setAnnotationDraft(target.value);
      }
    });
  }
})();
