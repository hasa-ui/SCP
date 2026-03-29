(function () {
  const utils = window.ArchiveDriftUtils;

  function createGameController(options) {
    const { gameData, saveManager, endingEngine } = options;
    let state = null;
    let preserveInitialStorageWarning = false;
    let saveReadOnlySession = false;
    const runtimeMetrics = {
      lastRenderMs: 0,
    };

    function init() {
      const loaded = saveManager.loadState(gameData);
      state =
        loaded.state ||
        saveManager.createInitialState(gameData, {
          warningReason: loaded.warningReason,
        });
      preserveInitialStorageWarning = Boolean(state.storageWarningReason);
      saveReadOnlySession = Boolean(loaded.skipInitialSave);
      if (!loaded.skipInitialSave) {
        syncState();
      }
      return state;
    }

    function finalizeInitialRender() {
      preserveInitialStorageWarning = false;
    }

    function getState() {
      return state;
    }

    function getGameData() {
      return gameData;
    }

    function getCurrentCase() {
      return gameData.cases[state.currentCaseIndex] || null;
    }

    function getCaseProgress(caseId) {
      return state.caseProgress[caseId];
    }

    function getDocumentAccess(caseData, doc) {
      const progress = getCaseProgress(caseData.id);
      if (doc.clearance > state.player.clearanceLevel) {
        return { available: false, reason: "権限不足" };
      }
      if (doc.unlockWhenRead && !doc.unlockWhenRead.every((id) => progress.readDocs.includes(id))) {
        return { available: false, reason: "読了待ち" };
      }
      if (
        doc.unlockWhenCompared &&
        !progress.comparePairsViewed.includes(utils.pairKey(doc.unlockWhenCompared))
      ) {
        return { available: false, reason: "比較待ち" };
      }
      return { available: true, reason: "" };
    }

    function getAccessibleDocuments(caseData) {
      return buildDocumentContext(caseData).accessibleDocs;
    }

    function getDayReadiness(caseData) {
      const { progress, accessibleDocs } = buildDocumentContext(caseData);
      return computeDayReadiness(progress, accessibleDocs);
    }

    function getStorageWarningMessage() {
      return saveManager.getStorageWarningMessage(state.storageWarningReason);
    }

    function getMustReadDocs(caseData) {
      if (!caseData) {
        return [];
      }
      const { progress, documentAccessById } = buildDocumentContext(caseData);
      return computeMustReadDocs(caseData, progress, documentAccessById);
    }

    function getRecommendedCompareHints(caseData) {
      if (!caseData) {
        return [];
      }
      const { progress, documentAccessById } = buildDocumentContext(caseData);
      return computeRecommendedCompareHints(caseData, progress, documentAccessById);
    }

    function getApprovalChecklist(caseData) {
      if (!caseData) {
        return {
          ready: false,
          completeCount: 0,
          totalCount: 0,
          items: [],
        };
      }
      const { progress, accessibleDocs, documentAccessById } = buildDocumentContext(caseData);
      const mustReadDocs = computeMustReadDocs(caseData, progress, documentAccessById);
      const compareHints = computeRecommendedCompareHints(caseData, progress, documentAccessById);
      return computeApprovalChecklist(caseData, progress, accessibleDocs, mustReadDocs, compareHints);
    }

    function getTutorialState() {
      const caseData = getCurrentCase();
      if (!caseData) {
        return {
          visible: false,
          steps: [],
          mustReadDocs: [],
          compareHints: [],
        };
      }
      const { progress, documentAccessById } = buildDocumentContext(caseData);
      const mustReadDocs = computeMustReadDocs(caseData, progress, documentAccessById);
      const compareHints = computeRecommendedCompareHints(caseData, progress, documentAccessById);
      return computeTutorialState(caseData, progress, mustReadDocs, compareHints);
    }

    function buildDebugSnapshot(validationReport) {
      const currentCase = getCurrentCase();
      const saveMetrics = saveManager.getMetrics();
      return {
        saveVersion: state.saveMeta?.version || state.version,
        migratedFrom: state.saveMeta?.migratedFrom || null,
        lastSavedAt: state.saveMeta?.lastSavedAt || null,
        currentCaseId: currentCase?.id || "",
        currentDay: state.player.dayCount,
        flags: [...state.flags],
        completedCaseIds: [...state.completedCaseIds],
        compareSelection: [...state.currentView.compareIds],
        accessibleDocumentIds: currentCase ? getAccessibleDocuments(currentCase).map((doc) => doc.id) : [],
        validationErrors: validationReport.errors.length,
        validationWarnings: validationReport.warnings.length,
        storageWarningReason: state.storageWarningReason || "",
        lastRenderMs: runtimeMetrics.lastRenderMs,
        lastSaveMs: saveMetrics.lastSaveMs,
        pendingSave: saveMetrics.pending,
        saveCount: saveMetrics.saveCount,
      };
    }

    function recordRenderDuration(value) {
      runtimeMetrics.lastRenderMs = Math.round(value * 100) / 100;
    }

    function startNewGame() {
      state = saveManager.createInitialState(gameData, {
        debugEnabled: state?.debug?.enabled,
      });
      preserveInitialStorageWarning = false;
      saveReadOnlySession = false;
      persist({ immediate: true });
    }

    function resetSave() {
      saveManager.clearSavedState(state);
      state = saveManager.createInitialState(gameData, {
        debugEnabled: state?.debug?.enabled,
      });
      preserveInitialStorageWarning = false;
      saveReadOnlySession = false;
      persist({ immediate: true });
    }

    function toggleDebugMode() {
      state.debug.enabled = !state.debug.enabled;
      persist();
    }

    function dismissTutorial() {
      if (!state.flags.includes("tutorialDismissed")) {
        state.flags.push("tutorialDismissed");
        persist();
      }
    }

    function setViewMode(mode) {
      state.currentView.mode = mode;
      persist();
    }

    function setCompareSelection(slot, value) {
      state.currentView.compareIds[slot] = value || "";
      persist();
    }

    function setCompareHintSelection(ids) {
      if (!Array.isArray(ids) || ids.length !== 2) {
        return;
      }
      state.currentView.compareIds = [ids[0] || "", ids[1] || ""];
      persist();
    }

    function setInterpretation(value) {
      const caseData = getCurrentCase();
      if (!caseData || state.gameOver) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      progress.selectedInterpretationId = value;
      progress.approved = false;
      persist();
    }

    function setDecision(value) {
      const caseData = getCurrentCase();
      if (!caseData || state.gameOver) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      progress.selectedDecisionId = value;
      progress.approved = false;
      persist();
    }

    function setAnnotationDraft(value) {
      const caseData = getCurrentCase();
      if (!caseData || state.gameOver) {
        return;
      }
      const docId = state.currentView.currentDocId;
      if (!docId) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      progress.annotationByDoc[docId] = value.slice(0, 320);
      persist();
    }

    function recordAnnotationCheckpoint() {
      logAction("注釈を記録した。");
      persist({ immediate: true });
    }

    function openDocument(docId) {
      const caseData = getCurrentCase();
      if (!caseData) {
        return;
      }
      const doc = caseData.documents.find((item) => item.id === docId);
      if (!doc) {
        return;
      }
      const access = getDocumentAccess(caseData, doc);
      if (!access.available) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      if (!progress.readDocs.includes(docId)) {
        progress.readDocs.push(docId);
        logAction(`文書「${doc.title}」を閲覧した。`);
      }
      state.currentView.currentDocId = docId;
      state.currentView.mode = "document";
      persist();
    }

    function toggleRedaction(docId, phrase) {
      const caseData = getCurrentCase();
      if (!caseData) {
        return;
      }
      const doc = caseData.documents.find((item) => item.id === docId);
      if (!doc) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      if (!progress.redactions[docId]) {
        progress.redactions[docId] = [];
      }
      const phrases = progress.redactions[docId];
      const index = phrases.indexOf(phrase);
      if (index >= 0) {
        phrases.splice(index, 1);
        logAction(`伏字を解除: ${phrase}`);
      } else {
        phrases.push(phrase);
        logAction(`伏字化: ${phrase}`);
      }
      persist();
    }

    function activateCompareView() {
      const caseData = getCurrentCase();
      if (!caseData) {
        return;
      }
      const [leftId, rightId] = state.currentView.compareIds;
      if (!leftId || !rightId || leftId === rightId) {
        return;
      }

      const leftDoc = caseData.documents.find((doc) => doc.id === leftId);
      const rightDoc = caseData.documents.find((doc) => doc.id === rightId);
      if (!leftDoc || !rightDoc) {
        return;
      }

      if (!getDocumentAccess(caseData, leftDoc).available || !getDocumentAccess(caseData, rightDoc).available) {
        return;
      }

      const progress = getCaseProgress(caseData.id);
      const key = utils.pairKey([leftId, rightId]);
      if (!progress.comparePairsViewed.includes(key)) {
        progress.comparePairsViewed.push(key);
        logAction(`比較照合: ${leftDoc.title} / ${rightDoc.title}`);
      }

      if (!progress.readDocs.includes(leftId)) {
        progress.readDocs.push(leftId);
      }
      if (!progress.readDocs.includes(rightId)) {
        progress.readDocs.push(rightId);
      }

      state.currentView.mode = "compare";
      persist();
    }

    function approveCurrentCase() {
      const caseData = getCurrentCase();
      if (!caseData) {
        return;
      }
      const progress = getCaseProgress(caseData.id);
      if (!progress.selectedInterpretationId || !progress.selectedDecisionId) {
        return;
      }
      progress.approved = true;
      logAction(`案件「${caseData.title}」の判断を承認した。`);
      persist({ immediate: true });
    }

    function endCurrentDay() {
      if (state.gameOver) {
        return;
      }
      const caseData = getCurrentCase();
      if (!caseData) {
        return;
      }
      const readiness = getDayReadiness(caseData);
      if (!readiness.ready) {
        return;
      }

      const progress = getCaseProgress(caseData.id);
      const outcome = resolveCaseOutcome(caseData, progress);
      applyOutcome(outcome);

      progress.outcomeSummary = outcome.summary;
      state.completedCaseIds.push(caseData.id);
      state.reports.push(outcome.report);
      state.overlay = {
        type: "report",
        report: outcome.report,
      };

      if (state.currentCaseIndex === gameData.cases.length - 1) {
        state.ending = endingEngine.determineEnding(state);
        state.gameOver = true;
        state.overlay = {
          type: "ending",
          ending: state.ending,
        };
        logAction(`最終判断を確定。エンディング: ${state.ending.title}`);
      } else {
        logAction(`日次処理完了: ${caseData.title}`);
      }

      persist({ immediate: true });
    }

    function dismissOverlay() {
      if (!state.overlay) {
        return;
      }

      if (state.overlay.type === "report") {
        state.overlay = null;
        state.currentCaseIndex += 1;
        state.player.dayCount = state.currentCaseIndex + 1;
        const nextCase = getCurrentCase();
        const nextDocs = nextCase ? getAccessibleDocuments(nextCase) : [];
        state.currentView = {
          mode: "document",
          currentDocId: nextDocs[0] ? nextDocs[0].id : "",
          compareIds: ["", ""],
        };
        logAction(`新規案件受領: ${nextCase.title}`);
        persist({ immediate: true });
        return;
      }

      if (state.overlay.type === "ending") {
        state.overlay = null;
        persist({ immediate: true });
      }
    }

    function syncState() {
      const currentCase = getCurrentCase();
      if (!currentCase) {
        return;
      }
      state.player.dayCount = state.currentCaseIndex + 1;
      const accessibleDocs = getAccessibleDocuments(currentCase);
      const hasCurrent = accessibleDocs.some((doc) => doc.id === state.currentView.currentDocId);
      if (!hasCurrent && accessibleDocs.length > 0) {
        state.currentView.currentDocId = accessibleDocs[0].id;
        state.currentView.mode = "document";
      }
      if (!Array.isArray(state.currentView.compareIds) || state.currentView.compareIds.length !== 2) {
        state.currentView.compareIds = ["", ""];
      }
      persist({ immediate: true });
    }

    function resolveCaseOutcome(caseData, progress) {
      const interpretation = caseData.interpretations.find(
        (item) => item.id === progress.selectedInterpretationId
      );
      const decision = caseData.decisions.find((item) => item.id === progress.selectedDecisionId);
      const effects = {};
      const lines = [];

      utils.mergeEffects(effects, interpretation.effects);
      utils.mergeEffects(effects, decision.effects);
      lines.push(interpretation.report);
      lines.push(decision.report);

      const accessibleDocs = getAccessibleDocuments(caseData);
      const readCoverage = accessibleDocs.length
        ? progress.readDocs.filter((id) => accessibleDocs.some((doc) => doc.id === id)).length /
          accessibleDocs.length
        : 1;

      if (readCoverage >= 1) {
        effects.evaluation = (effects.evaluation || 0) + 1;
        lines.push("閲覧可能な文書はすべて確認され、最低限の審査要件は満たされた。");
      } else {
        effects.evaluation = (effects.evaluation || 0) - 2;
        effects.truth = (effects.truth || 0) - 2;
        lines.push("未確認文書を残したまま判断したため、審査精度が落ちた。");
      }

      if (progress.comparePairsViewed.length > 0) {
        effects.truth = (effects.truth || 0) + 2;
        effects.evaluation = (effects.evaluation || 0) + 1;
        lines.push("比較照合により、記録間の矛盾が日次報告へ反映された。");
      } else {
        effects.truth = (effects.truth || 0) - 2;
        lines.push("比較照合を行わなかったため、矛盾点の採用精度が低下した。");
      }

      if (interpretation.id === caseData.truthChoiceId) {
        effects.truth = (effects.truth || 0) + 3;
        lines.push("事実層に近い解釈が採用され、後続判断の精度が上がった。");
      }

      if (decision.id === caseData.bestActionId) {
        effects.containment = (effects.containment || 0) + 2;
        effects.secrecy = (effects.secrecy || 0) + 1;
        lines.push("対処方針は症状条件に噛み合っており、追加被害は抑制された。");
      }

      const redactionInfo = evaluateRedactions(caseData, progress);
      utils.mergeEffects(effects, redactionInfo.effects);
      lines.push(redactionInfo.line);

      const annotationInfo = evaluateAnnotations(caseData, progress);
      utils.mergeEffects(effects, annotationInfo.effects);
      lines.push(annotationInfo.line);

      if (Array.isArray(decision.flags)) {
        decision.flags.forEach((flag) => {
          if (!state.flags.includes(flag)) {
            state.flags.push(flag);
          }
        });
      }

      return {
        summary: `${caseData.title} を ${decision.label} として処理。`,
        effects,
        report: {
          caseTitle: caseData.title,
          summary: `${caseData.title} を ${decision.label} として処理。`,
          interpretationLabel: interpretation.label,
          decisionLabel: decision.label,
          compareCount: progress.comparePairsViewed.length,
          readCount: accessibleDocs.filter((doc) => progress.readDocs.includes(doc.id)).length,
          accessibleDocCount: accessibleDocs.length,
          memoPresent: Object.values(progress.annotationByDoc).some((value) => String(value || "").trim()),
          lines,
          delta: utils.formatEffectSummary(effects),
        },
      };
    }

    function evaluateRedactions(caseData, progress) {
      const result = {
        effects: {},
        line: "伏字処理は行われていない。",
      };

      let totalRedactions = 0;
      let exposedDanger = 0;

      caseData.documents.forEach((doc) => {
        const applied = progress.redactions[doc.id] || [];
        totalRedactions += applied.length;
        const dangerWeight = doc.dangerTags.some((tag) => tag.includes("災害") || tag.includes("改変"));
        if (dangerWeight) {
          exposedDanger += Math.max((doc.editablePhrases || []).length - applied.length, 0);
        }
      });

      if (totalRedactions > 0) {
        result.effects.secrecy = Math.min(totalRedactions, 3);
        result.effects.contamination = -Math.min(totalRedactions, 2);
        result.line = `危険語句 ${totalRedactions} 件を伏字化し、露出は抑制された。`;
      }

      if (exposedDanger > 0) {
        result.effects.contamination = (result.effects.contamination || 0) + Math.min(exposedDanger, 3);
        result.line += ` 未処理語句が残り、汚染余波が ${Math.min(exposedDanger, 3)} 点分発生した。`;
      }

      if (totalRedactions > caseData.safeRedactionLimit) {
        result.effects.truth = (result.effects.truth || 0) - 3;
        result.effects.evaluation = (result.effects.evaluation || 0) - 1;
        result.line += " ただし過剰伏字により、現場へ返す情報が痩せた。";
      }

      return result;
    }

    function evaluateAnnotations(caseData, progress) {
      const combined = Object.values(progress.annotationByDoc)
        .join(" ")
        .trim()
        .toLowerCase();

      if (!combined) {
        return {
          effects: { evaluation: -1 },
          line: "分析メモが残されず、後続審査の引き継ぎ効率が低下した。",
        };
      }

      const matchedKeyword = caseData.analysisKeywords.find((keyword) =>
        combined.includes(keyword.toLowerCase())
      );
      if (matchedKeyword) {
        return {
          effects: { truth: 2, evaluation: 2 },
          line: `注釈に「${matchedKeyword}」を含む分析メモが残され、矛盾点の共有に成功した。`,
        };
      }

      return {
        effects: { evaluation: 1 },
        line: "注釈は残されたが、核心語への言及が薄く、補助効果は限定的だった。",
      };
    }

    function applyOutcome(outcome) {
      const effects = outcome.effects;

      state.site.containment = utils.clamp(
        state.site.containment + (effects.containment || 0),
        0,
        100
      );
      state.site.secrecy = utils.clamp(state.site.secrecy + (effects.secrecy || 0), 0, 100);
      state.site.truth = utils.clamp(state.site.truth + (effects.truth || 0), 0, 100);
      state.site.casualties += effects.casualties || 0;

      state.player.recognition = utils.clamp(
        state.player.recognition + (effects.recognition || 0) - Math.max(effects.contamination || 0, 0),
        0,
        100
      );
      state.player.memory = utils.clamp(
        state.player.memory + (effects.memory || 0) - Math.max(Math.ceil((effects.contamination || 0) / 2), 0),
        0,
        100
      );
      state.player.contamination = utils.clamp(
        state.player.contamination + (effects.contamination || 0),
        0,
        100
      );
      state.player.obsession = utils.clamp(
        state.player.obsession + (effects.obsession || 0) + ((effects.truth || 0) > 0 ? 1 : 0),
        0,
        100
      );
      state.player.ethics = utils.clamp(
        state.player.ethics + (effects.ethics || 0) + (effects.casualties || 0),
        0,
        100
      );
      state.player.evaluation = utils.clamp(
        state.player.evaluation + (effects.evaluation || 0),
        0,
        100
      );

      upgradeClearanceIfEligible();
    }

    function upgradeClearanceIfEligible() {
      const before = state.player.clearanceLevel;
      if (state.player.evaluation >= 78 && state.currentCaseIndex >= 5) {
        state.player.clearanceLevel = 4;
      } else if (state.player.evaluation >= 68 && state.currentCaseIndex >= 3) {
        state.player.clearanceLevel = 3;
      }
      if (state.player.clearanceLevel > before) {
        logAction(`閲覧権限が CL-${state.player.clearanceLevel} に更新された。`);
      }
    }

    function logAction(message) {
      state.logs.unshift(utils.makeLogEntry(message));
      state.logs = state.logs.slice(0, 12);
    }

    function persist(saveOptions = {}) {
      if (saveReadOnlySession) {
        return;
      }
      saveManager.requestSave(state, {
        preserveWarning: preserveInitialStorageWarning,
        immediate: Boolean(saveOptions.immediate),
      });
    }

    function flushPendingState() {
      if (saveReadOnlySession) {
        return;
      }
      saveManager.flushPendingSave();
    }

    function buildRenderModel(validationReport) {
      const caseData = getCurrentCase();
      const context = caseData
        ? buildDocumentContext(caseData)
        : { progress: null, documentAccessById: {}, accessibleDocs: [] };
      const mustReadDocs = caseData
        ? computeMustReadDocs(caseData, context.progress, context.documentAccessById)
        : [];
      const compareHints = caseData
        ? computeRecommendedCompareHints(caseData, context.progress, context.documentAccessById)
        : [];
      const readiness = caseData ? computeDayReadiness(context.progress, context.accessibleDocs) : { ready: false, message: "" };
      const checklist = caseData
        ? computeApprovalChecklist(caseData, context.progress, context.accessibleDocs, mustReadDocs, compareHints)
        : { items: [], completeCount: 0, totalCount: 0 };
      const tutorial = caseData
        ? computeTutorialState(caseData, context.progress, mustReadDocs, compareHints)
        : { visible: false, steps: [] };
      const currentDoc = caseData
        ? caseData.documents.find((item) => item.id === state.currentView.currentDocId) || null
        : null;
      const debugSnapshot = buildDebugSnapshot(validationReport);

      return {
        state,
        caseData,
        progress: context.progress,
        documentAccessById: context.documentAccessById,
        accessibleDocs: context.accessibleDocs,
        mustReadDocs,
        compareHints,
        readiness,
        checklist,
        tutorial,
        currentDoc,
        debugSnapshot,
      };
    }

    function buildDocumentContext(caseData) {
      const progress = getCaseProgress(caseData.id);
      const documentAccessById = Object.fromEntries(
        caseData.documents.map((doc) => [doc.id, getDocumentAccess(caseData, doc)])
      );
      const accessibleDocs = caseData.documents.filter((doc) => documentAccessById[doc.id]?.available);
      return {
        progress,
        documentAccessById,
        accessibleDocs,
      };
    }

    function computeDayReadiness(progress, accessibleDocs) {
      const unread = accessibleDocs.filter((doc) => !progress.readDocs.includes(doc.id));

      if (!progress.selectedInterpretationId || !progress.selectedDecisionId) {
        return { ready: false, message: "解釈と対処方針を選択する必要がある。" };
      }

      if (!progress.approved) {
        return { ready: false, message: "判断を承認してから日次処理へ進む。" };
      }

      if (unread.length > 0) {
        return {
          ready: false,
          message: `未読文書あり: ${unread.map((doc) => doc.title).join(" / ")}`,
        };
      }

      return { ready: true, message: "日次処理を実行可能。" };
    }

    function computeMustReadDocs(caseData, progress, documentAccessById) {
      const fallbackIds = (caseData.documents || []).slice(0, 2).map((doc) => doc.id);
      const mustReadIds = caseData.compareHints[0]?.ids?.length ? caseData.compareHints[0].ids : fallbackIds;
      return mustReadIds
        .map((docId) => caseData.documents.find((doc) => doc.id === docId))
        .filter(Boolean)
        .map((doc) => ({
          id: doc.id,
          title: doc.title,
          available: documentAccessById[doc.id]?.available || false,
          reason: documentAccessById[doc.id]?.reason || "",
          read: progress.readDocs.includes(doc.id),
        }));
    }

    function computeRecommendedCompareHints(caseData, progress, documentAccessById) {
      return (caseData.compareHints || []).map((hint, index) => {
        const docs = hint.ids
          .map((docId) => caseData.documents.find((doc) => doc.id === docId))
          .filter(Boolean);
        const available = docs.length === 2 && docs.every((doc) => documentAccessById[doc.id]?.available);
        return {
          key: `${caseData.id}:${index}`,
          ids: [...hint.ids],
          label: hint.label,
          hint: hint.hint,
          docs: docs.map((doc) => ({ id: doc.id, title: doc.title })),
          available,
          viewed: progress.comparePairsViewed.includes(utils.pairKey(hint.ids)),
          unreadDocs: docs.filter((doc) => !progress.readDocs.includes(doc.id)).map((doc) => doc.title),
        };
      });
    }

    function computeApprovalChecklist(caseData, progress, accessibleDocs, mustReadDocs, compareHints) {
      const unreadDocs = accessibleDocs.filter((doc) => !progress.readDocs.includes(doc.id));
      const memoPresent = Object.values(progress.annotationByDoc).some((value) => String(value || "").trim());
      const compareDone = progress.comparePairsViewed.length > 0;
      const mustReadPending = mustReadDocs.filter((doc) => doc.available && !doc.read);
      const items = [
        {
          id: "read-docs",
          label: "閲覧可能な文書を確認する",
          done: unreadDocs.length === 0,
          detail:
            unreadDocs.length === 0
              ? "未読文書なし"
              : `未読: ${unreadDocs.map((doc) => doc.title).join(" / ")}`,
        },
        {
          id: "must-read",
          label: "必読文書を押さえる",
          done: mustReadPending.length === 0,
          detail:
            mustReadPending.length === 0
              ? "初回導線の必読文書を確認済み"
              : `残り: ${mustReadPending.map((doc) => doc.title).join(" / ")}`,
        },
        {
          id: "compare",
          label: "比較照合を行う",
          done: compareDone,
          detail:
            compareDone
              ? "比較履歴あり"
              : compareHints.length > 0
                ? "推奨比較を 1 件以上確認すると精度が上がる"
                : "比較可能な文書対があれば確認すると精度が上がる",
        },
        {
          id: "interpretation",
          label: "解釈を選ぶ",
          done: Boolean(progress.selectedInterpretationId),
          detail: progress.selectedInterpretationId ? "選択済み" : "何が起きているかを選ぶ",
        },
        {
          id: "decision",
          label: "対処方針を選ぶ",
          done: Boolean(progress.selectedDecisionId),
          detail: progress.selectedDecisionId ? "選択済み" : "何を実行するかを選ぶ",
        },
        {
          id: "memo",
          label: "引き継ぎメモを残す",
          done: memoPresent,
          detail: memoPresent ? "分析メモあり" : "核心語を含む短いメモが推奨",
        },
        {
          id: "approval",
          label: "判断を承認する",
          done: progress.approved,
          detail: progress.approved ? "承認済み" : "内容が固まったら承認",
        },
      ];

      return {
        ready: unreadDocs.length === 0 && progress.approved,
        completeCount: items.filter((item) => item.done).length,
        totalCount: items.length,
        items,
      };
    }

    function computeTutorialState(caseData, progress, mustReadDocs, compareHints) {
      return {
        visible:
          state.currentCaseIndex === 0 &&
          state.completedCaseIds.length === 0 &&
          !state.flags.includes("tutorialDismissed"),
        mustReadDocs,
        compareHints,
        steps: [
          {
            label: "必読文書を読む",
            done: mustReadDocs.filter((doc) => doc.available).every((doc) => doc.read),
          },
          {
            label: "推奨比較を確認する",
            done: compareHints.some((hint) => hint.viewed),
          },
          {
            label: "解釈と対処方針を選ぶ",
            done: Boolean(progress.selectedInterpretationId && progress.selectedDecisionId),
          },
          {
            label: "承認して日次処理へ進む",
            done: progress.approved,
          },
        ],
      };
    }

    return {
      init,
      finalizeInitialRender,
      getState,
      getGameData,
      getCurrentCase,
      getCaseProgress,
      getDocumentAccess,
      getAccessibleDocuments,
      getDayReadiness,
      getStorageWarningMessage,
      getMustReadDocs,
      getRecommendedCompareHints,
      getApprovalChecklist,
      getTutorialState,
      buildDebugSnapshot,
      buildRenderModel,
      recordRenderDuration,
      flushPendingState,
      startNewGame,
      resetSave,
      toggleDebugMode,
      dismissTutorial,
      setViewMode,
      setCompareSelection,
      setCompareHintSelection,
      setInterpretation,
      setDecision,
      setAnnotationDraft,
      recordAnnotationCheckpoint,
      openDocument,
      toggleRedaction,
      activateCompareView,
      approveCurrentCase,
      endCurrentDay,
      dismissOverlay,
    };
  }

  window.ArchiveDriftGameEngine = {
    createGameController,
  };
})();
