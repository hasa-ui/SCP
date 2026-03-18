(function () {
  const SAVE_KEY = "scp-archive-drift-mvp-v1";
  const MAX_LOG_ENTRIES = 12;
  const PLAYER_STAT_LABELS = {
    recognition: "認識安定性",
    memory: "記憶信頼度",
    contamination: "閲覧汚染度",
    obsession: "執着指数",
    ethics: "倫理負荷",
    evaluation: "職務評価",
  };
  const SITE_STAT_LABELS = {
    containment: "収容安定度",
    secrecy: "秘匿保持",
    truth: "真実保全",
  };

  let state = null;
  let storageAvailable = true;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    state = loadState() || createInitialState();
    syncState();
    bindEvents();
    render();
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
  }

  function handleClick(event) {
    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) {
      return;
    }

    const action = actionNode.dataset.action;

    if (
      state.gameOver &&
      !["new-game", "reset-save", "overlay-next"].includes(action)
    ) {
      return;
    }

    if (action === "new-game") {
      if (window.confirm("現在の進行を破棄して新規周回を開始しますか。")) {
        state = createInitialState();
        saveState();
        render();
      }
      return;
    }

    if (action === "reset-save") {
      if (window.confirm("ローカルセーブを削除しますか。")) {
        clearSavedState();
        state = createInitialState();
        saveState();
        render();
      }
      return;
    }

    if (action === "open-doc") {
      openDocument(actionNode.dataset.docId);
      return;
    }

    if (action === "toggle-redaction") {
      toggleRedaction(actionNode.dataset.docId, actionNode.dataset.phrase);
      return;
    }

    if (action === "save-annotation") {
      logAction("注釈を記録した。");
      saveState();
      render();
      return;
    }

    if (action === "show-compare") {
      activateCompareView();
      return;
    }

    if (action === "back-to-document") {
      state.currentView.mode = "document";
      saveState();
      render();
      return;
    }

    if (action === "approve-case") {
      approveCurrentCase();
      return;
    }

    if (action === "end-day") {
      endCurrentDay();
      return;
    }

    if (action === "overlay-next") {
      dismissOverlay();
      return;
    }
  }

  function handleChange(event) {
    const caseData = getCurrentCase();
    if (!caseData || state.gameOver) {
      return;
    }

    const progress = getCaseProgress(caseData.id);

    if (event.target.name === "interpretation") {
      progress.selectedInterpretationId = event.target.value;
      progress.approved = false;
      saveState();
      render();
      return;
    }

    if (event.target.name === "decision") {
      progress.selectedDecisionId = event.target.value;
      progress.approved = false;
      saveState();
      render();
      return;
    }

    if (event.target.id === "compare-left") {
      state.currentView.compareIds[0] = event.target.value || "";
      saveState();
      render();
      return;
    }

    if (event.target.id === "compare-right") {
      state.currentView.compareIds[1] = event.target.value || "";
      saveState();
      render();
    }
  }

  function handleInput(event) {
    const caseData = getCurrentCase();
    if (!caseData || state.gameOver) {
      return;
    }

    if (event.target.id === "annotation-input") {
      const progress = getCaseProgress(caseData.id);
      const docId = state.currentView.currentDocId;
      if (!docId) {
        return;
      }
      progress.annotationByDoc[docId] = event.target.value.slice(0, 320);
      saveState();
    }
  }

  function createInitialState() {
    const caseProgress = {};
    window.GAME_DATA.cases.forEach((caseData) => {
      caseProgress[caseData.id] = {
        readDocs: [],
        redactions: {},
        annotationByDoc: {},
        selectedInterpretationId: "",
        selectedDecisionId: "",
        approved: false,
        comparePairsViewed: [],
        outcomeSummary: "",
      };
    });

    return {
      version: 1,
      player: deepClone(window.GAME_DATA.initialPlayer),
      site: deepClone(window.GAME_DATA.initialSite),
      flags: [],
      currentCaseIndex: 0,
      currentView: {
        mode: "document",
        currentDocId: window.GAME_DATA.cases[0].documents[0].id,
        compareIds: ["", ""],
      },
      completedCaseIds: [],
      caseProgress,
      reports: [],
      logs: [
        makeLogEntry("配属完了。記録整合管理局の当直が開始された。"),
        makeLogEntry("初期権限は CL-2。案件の整合確認と採用判断を担当する。"),
      ],
      storageWarning: !storageAvailable,
      overlay: null,
      gameOver: false,
      ending: null,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1) {
        return null;
      }
      return parsed;
    } catch (error) {
      storageAvailable = false;
      return null;
    }
  }

  function saveState() {
    if (!storageAvailable) {
      if (state) {
        state.storageWarning = true;
      }
      return false;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      markStorageUnavailable();
      return false;
    }
  }

  function clearSavedState() {
    if (!storageAvailable) {
      if (state) {
        state.storageWarning = true;
      }
      return false;
    }
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (error) {
      markStorageUnavailable();
      return false;
    }
  }

  function markStorageUnavailable() {
    storageAvailable = false;
    if (state) {
      state.storageWarning = true;
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
    saveState();
  }

  function getCurrentCase() {
    return window.GAME_DATA.cases[state.currentCaseIndex] || null;
  }

  function getCaseProgress(caseId) {
    return state.caseProgress[caseId];
  }

  function openDocument(docId) {
    const caseData = getCurrentCase();
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
    saveState();
    render();
  }

  function toggleRedaction(docId, phrase) {
    const caseData = getCurrentCase();
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
    saveState();
    render();
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
    const key = pairKey([leftId, rightId]);
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
    saveState();
    render();
  }

  function approveCurrentCase() {
    const caseData = getCurrentCase();
    const progress = getCaseProgress(caseData.id);
    if (!progress.selectedInterpretationId || !progress.selectedDecisionId) {
      return;
    }
    progress.approved = true;
    logAction(`案件「${caseData.title}」の判断を承認した。`);
    saveState();
    render();
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

    if (state.currentCaseIndex === window.GAME_DATA.cases.length - 1) {
      const ending = determineEnding();
      state.ending = ending;
      state.gameOver = true;
      state.overlay = {
        type: "ending",
        ending,
      };
      logAction(`最終判断を確定。エンディング: ${ending.title}`);
    } else {
      logAction(`日次処理完了: ${caseData.title}`);
    }

    saveState();
    render();
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
      saveState();
      render();
      return;
    }

    if (state.overlay.type === "ending") {
      state.overlay = null;
      saveState();
      render();
    }
  }

  function resolveCaseOutcome(caseData, progress) {
    const interpretation = caseData.interpretations.find(
      (item) => item.id === progress.selectedInterpretationId
    );
    const decision = caseData.decisions.find((item) => item.id === progress.selectedDecisionId);
    const effects = {};
    const lines = [];

    mergeEffects(effects, interpretation.effects);
    mergeEffects(effects, decision.effects);
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
    mergeEffects(effects, redactionInfo.effects);
    lines.push(redactionInfo.line);

    const annotationInfo = evaluateAnnotations(caseData, progress);
    mergeEffects(effects, annotationInfo.effects);
    lines.push(annotationInfo.line);

    if (Array.isArray(decision.flags)) {
      decision.flags.forEach((flag) => {
        if (!state.flags.includes(flag)) {
          state.flags.push(flag);
        }
      });
    }

    const formattedDelta = formatEffectSummary(effects);
    const summary = `${caseData.title} を ${decision.label} として処理。`;

    return {
      summary,
      effects,
      report: {
        caseTitle: caseData.title,
        summary,
        lines,
        delta: formattedDelta,
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

    state.site.containment = clamp(
      state.site.containment + (effects.containment || 0),
      0,
      100
    );
    state.site.secrecy = clamp(state.site.secrecy + (effects.secrecy || 0), 0, 100);
    state.site.truth = clamp(state.site.truth + (effects.truth || 0), 0, 100);
    state.site.casualties += effects.casualties || 0;

    state.player.recognition = clamp(
      state.player.recognition + (effects.recognition || 0) - Math.max(effects.contamination || 0, 0),
      0,
      100
    );
    state.player.memory = clamp(
      state.player.memory + (effects.memory || 0) - Math.max(Math.ceil((effects.contamination || 0) / 2), 0),
      0,
      100
    );
    state.player.contamination = clamp(
      state.player.contamination + (effects.contamination || 0),
      0,
      100
    );
    state.player.obsession = clamp(
      state.player.obsession + (effects.obsession || 0) + ((effects.truth || 0) > 0 ? 1 : 0),
      0,
      100
    );
    state.player.ethics = clamp(
      state.player.ethics + (effects.ethics || 0) + (effects.casualties || 0),
      0,
      100
    );
    state.player.evaluation = clamp(
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

  function determineEnding() {
    const contamination = state.player.contamination;
    const recognition = state.player.recognition;
    const truth = state.site.truth;
    const secrecy = state.site.secrecy;
    const containment = state.site.containment;
    const casualties = state.site.casualties;
    const stableSite = containment >= 70 && secrecy >= 65 && casualties === 0;

    if (
      contamination >= 72 ||
      recognition <= 25 ||
      state.flags.includes("terminalAccepted") && contamination >= 60
    ) {
      return {
        id: "infected",
        title: "感染エンド",
        description:
          "分析官は採用圧力と閲覧汚染を切り分けられず、新たな収容対象として記録される。残された文書は、あなたを注記側の一部として扱い始める。",
      };
    }

    if (state.flags.includes("canonicalFalseArchive")) {
      return {
        id: "record-dominion",
        title: "記録支配エンド",
        description:
          "収容は書類上で完了し、現実は採用された版へ引き寄せられる。真相は溶けるが、記録だけは完璧に整う。",
      };
    }

    if (state.flags.includes("contradictoryArchive") || truth >= 72) {
      return {
        id: "truth",
        title: "真実保存エンド",
        description:
          "矛盾は消されず、多数の不安定な版が残された。被害は続くが、何が失われたかを記録する道だけは守られた。",
      };
    }

    if (contamination >= 55 && secrecy >= 60) {
      return {
        id: "record-dominion",
        title: "記録支配エンド",
        description:
          "収容は書類上で完了し、現実は採用された版へ引き寄せられる。真相は溶けるが、記録だけは完璧に整う。",
      };
    }

    if (stableSite) {
      return {
        id: "foundation",
        title: "模範的財団エンド",
        description:
          "収容は安定し、秘匿も維持された。多数の差分と真相は削ぎ落とされたが、財団は機能し続ける。",
      };
    }

    return {
      id: "false-stability",
      title: "偽安定エンド",
      description:
        "帳票上は辛うじて保たれているが、収容は安定と呼べる水準に届いていない。消された差分だけが、次の崩れを予告している。",
    };
  }

  function render() {
    syncState();
    renderDaySummary();
    renderStats();
    renderCases();
    renderDocuments();
    renderReader();
    renderCaseSummary();
    renderCompareControls();
    renderEditControls();
    renderDecisionControls();
    renderActivityLog();
    renderOverlay();
  }

  function renderDaySummary() {
    const target = document.getElementById("day-summary");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const report = state.reports[state.reports.length - 1];
    target.innerHTML = `
      <div class="summary-grid">
        <div>
          <div class="muted small">Day</div>
          <div class="mono">D-${caseData.day}</div>
        </div>
        <div>
          <div class="muted small">Clearance</div>
          <div class="mono">CL-${state.player.clearanceLevel}</div>
        </div>
      </div>
      <div>
        <strong>${escapeHtml(caseData.title)}</strong>
        <div class="muted small">${escapeHtml(caseData.summary)}</div>
      </div>
      ${
        report
          ? `<div class="status-block small"><strong>前日報告</strong><br />${escapeHtml(
              report.summary
            )}</div>`
          : ""
      }
      ${
        state.storageWarning
          ? `<div class="warning-block small"><strong>セーブ警告</strong><br />この環境ではローカル保存に失敗しました。進行は現在のタブ内でのみ保持されます。</div>`
          : ""
      }
    `;
  }

  function renderStats() {
    const playerTarget = document.getElementById("player-stats");
    const siteTarget = document.getElementById("site-stats");

    playerTarget.innerHTML = Object.entries(PLAYER_STAT_LABELS)
      .map(([key, label]) => renderStatCard(label, state.player[key], key === "contamination"))
      .join("");

    siteTarget.innerHTML =
      Object.entries(SITE_STAT_LABELS)
        .map(([key, label]) => renderStatCard(label, state.site[key], false))
        .join("") +
      renderStatCard("累計人的損失", Math.min(state.site.casualties * 12, 100), true, state.site.casualties);
  }

  function renderStatCard(label, value, inverseDanger, displayValue) {
    let cssClass = "";
    if (inverseDanger) {
      cssClass = value >= 70 ? "alert" : value >= 40 ? "warn" : "";
    } else {
      cssClass = value >= 70 ? "" : value >= 40 ? "warn" : "alert";
    }
    const normalizedClass = cssClass === "safe" ? "" : cssClass;
    return `
      <div class="stat-card">
        <div class="stat-head">
          <span>${escapeHtml(label)}</span>
          <span class="mono">${displayValue !== undefined ? displayValue : value}</span>
        </div>
        <div class="stat-track">
          <div class="stat-fill ${normalizedClass}" style="width:${clamp(value, 0, 100)}%"></div>
        </div>
      </div>
    `;
  }

  function renderCases() {
    const target = document.getElementById("case-list");
    target.innerHTML = window.GAME_DATA.cases
      .map((caseData, index) => {
        const status = state.completedCaseIds.includes(caseData.id)
          ? "処理済"
          : index === state.currentCaseIndex
            ? "進行中"
            : "待機";
        const currentClass = index === state.currentCaseIndex ? "current" : "";
        const progress = getCaseProgress(caseData.id);
        return `
          <article class="case-card ${currentClass}">
            <header>
              <div>
                <div class="small muted">Day ${caseData.day}</div>
                <strong>${escapeHtml(caseData.title)}</strong>
              </div>
              <span class="tag">${status}</span>
            </header>
            <div class="small muted">${escapeHtml(caseData.classification)}</div>
            ${
              progress.outcomeSummary
                ? `<div class="small">${escapeHtml(progress.outcomeSummary)}</div>`
                : `<div class="small muted">${escapeHtml(caseData.summary)}</div>`
            }
          </article>
        `;
      })
      .join("");
  }

  function renderDocuments() {
    const target = document.getElementById("document-list");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const progress = getCaseProgress(caseData.id);
    target.innerHTML = caseData.documents
      .map((doc) => {
        const access = getDocumentAccess(caseData, doc);
        const isActive = state.currentView.currentDocId === doc.id && state.currentView.mode === "document";
        const isRead = progress.readDocs.includes(doc.id);
        return `
          <article class="doc-card ${isActive ? "active" : ""} ${access.available ? "" : "locked"}">
            <header>
              <div>
                <strong>${escapeHtml(doc.title)}</strong>
                <div class="small muted">${escapeHtml(doc.author)} / CL-${doc.clearance}</div>
              </div>
              <span class="tag">${access.available ? (isRead ? "既読" : "未読") : access.reason}</span>
            </header>
            <div class="inline-actions">
              <button class="minor-button" data-action="open-doc" data-doc-id="${doc.id}" ${
                access.available ? "" : "disabled"
              }>開く</button>
              ${doc.dangerTags
                .map((tag) => `<span class="tag small">${escapeHtml(tag)}</span>`)
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderReader() {
    const caseData = getCurrentCase();
    const header = document.getElementById("reader-header");
    const content = document.getElementById("reader-content");
    if (!caseData) {
      header.innerHTML = "";
      content.innerHTML = "";
      return;
    }

    if (state.currentView.mode === "compare") {
      const compareHtml = renderCompareView(caseData);
      header.innerHTML = compareHtml.header;
      content.innerHTML = compareHtml.content;
      return;
    }

    const doc = caseData.documents.find((item) => item.id === state.currentView.currentDocId);
    if (!doc) {
      header.innerHTML = "";
      content.innerHTML = `<div class="warning-block">閲覧可能な文書がありません。</div>`;
      return;
    }

    const progress = getCaseProgress(caseData.id);
    const redacted = progress.redactions[doc.id] || [];
    const presentedText = getPresentedText(doc, redacted, "reader");
    const annotation = progress.annotationByDoc[doc.id] || "";

    header.innerHTML = `
      <div class="reader-header-top">
        <div>
          <div class="small muted">${escapeHtml(caseData.title)}</div>
          <h2>${escapeHtml(doc.title)}</h2>
        </div>
        <button class="minor-button" data-action="back-to-document">本文表示</button>
      </div>
      <div class="reader-meta">
        <span class="meta-chip">${escapeHtml(doc.author)}</span>
        <span class="meta-chip mono">${escapeHtml(doc.createdAt)}</span>
        <span class="meta-chip">CL-${doc.clearance}</span>
        <span class="meta-chip">${escapeHtml(doc.version)}</span>
        ${doc.dangerTags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;

    content.innerHTML = `
      ${
        renderReaderWarnings(doc).length
          ? `<div class="warning-block">${renderReaderWarnings(doc)}</div>`
          : ""
      }
      <div class="document-body">${renderParagraphs(presentedText)}</div>
      <div class="status-block">
        <strong>文書注記</strong>
        <div class="small">${doc.notes.map(escapeHtml).join("<br />")}</div>
      </div>
      ${
        annotation
          ? `<div class="annotation-block"><strong>分析官メモ</strong><div class="small">${escapeHtml(
              annotation
            ).replace(/\n/g, "<br />")}</div></div>`
          : ""
      }
      ${
        redacted.length
          ? `<div class="annotation-block small"><strong>現行伏字</strong><br />${redacted
              .map(escapeHtml)
              .join(" / ")}</div>`
          : ""
      }
    `;
  }

  function renderCompareView(caseData) {
    const [leftId, rightId] = state.currentView.compareIds;
    const leftDoc = caseData.documents.find((doc) => doc.id === leftId);
    const rightDoc = caseData.documents.find((doc) => doc.id === rightId);
    if (!leftDoc || !rightDoc) {
      return {
        header: `<h2>比較対象が不足しています</h2>`,
        content: `<div class="warning-block">左と右の文書を選択してください。</div>`,
      };
    }

    const progress = getCaseProgress(caseData.id);
    const leftText = getPresentedText(leftDoc, progress.redactions[leftId] || [], "compare");
    const rightText = getPresentedText(rightDoc, progress.redactions[rightId] || [], "compare");
    const rows = buildDiffRows(leftText, rightText);

    return {
      header: `
        <div class="reader-header-top">
          <div>
            <div class="small muted">${escapeHtml(caseData.title)}</div>
            <h2>文書比較</h2>
          </div>
          <button class="minor-button" data-action="back-to-document">本文へ戻る</button>
        </div>
        <div class="reader-meta">
          <span class="meta-chip">${escapeHtml(leftDoc.title)}</span>
          <span class="meta-chip">${escapeHtml(rightDoc.title)}</span>
        </div>
      `,
      content: `
        ${
          state.player.contamination >= 55
            ? `<div class="warning-block small">汚染度上昇により、比較表示の一部が欠損して見える可能性があります。</div>`
            : ""
        }
        <div class="diff-grid">
          <div class="diff-column">
            <div class="diff-head">
              <strong>${escapeHtml(leftDoc.title)}</strong>
            </div>
            <div class="diff-rows">
              ${rows
                .map(
                  (row) => `<div class="diff-row ${row.changed ? "changed" : ""} ${
                    row.left ? "" : "empty"
                  }">${escapeHtml(row.left || "—")}</div>`
                )
                .join("")}
            </div>
          </div>
          <div class="diff-column">
            <div class="diff-head">
              <strong>${escapeHtml(rightDoc.title)}</strong>
            </div>
            <div class="diff-rows">
              ${rows
                .map(
                  (row) => `<div class="diff-row ${row.changed ? "changed" : ""} ${
                    row.right ? "" : "empty"
                  }">${escapeHtml(row.right || "—")}</div>`
                )
                .join("")}
            </div>
          </div>
        </div>
      `,
    };
  }

  function renderCaseSummary() {
    const target = document.getElementById("case-summary");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const readiness = getDayReadiness(caseData);
    const notes = (caseData.continuityNotes || [])
      .filter((note) => state.flags.includes(note.flag))
      .map((note) => `<div class="summary-note small">${escapeHtml(note.text)}</div>`)
      .join("");

    target.innerHTML = `
      <div class="control-card">
        <div class="small muted">分類</div>
        <strong>${escapeHtml(caseData.classification)}</strong>
        <div class="small">${escapeHtml(caseData.briefing)}</div>
      </div>
      <div class="control-card">
        <div class="inline-actions">
          <span class="tag">優先度 ${escapeHtml(caseData.priority)}</span>
          <span class="tag">危険度 ${escapeHtml(caseData.riskLevel)}</span>
        </div>
        <div class="small muted">判断準備</div>
        <div class="small">${escapeHtml(readiness.message)}</div>
      </div>
      <div class="control-card">
        <strong>比較ヒント</strong>
        <div class="small">
          ${caseData.compareHints
            .map(
              (hint) =>
                `<div><strong>${escapeHtml(hint.label)}</strong><br />${escapeHtml(hint.hint)}</div>`
            )
            .join("<br />")}
        </div>
      </div>
      ${notes}
    `;
  }

  function renderCompareControls() {
    const target = document.getElementById("compare-controls");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const accessibleDocs = getAccessibleDocuments(caseData);
    const [leftId, rightId] = state.currentView.compareIds;

    target.innerHTML = `
      <div class="control-card">
        <label>
          <span class="small muted">左</span>
          <select id="compare-left" ${state.gameOver ? "disabled" : ""}>
            <option value="">文書を選択</option>
            ${accessibleDocs
              .map(
                (doc) =>
                  `<option value="${doc.id}" ${leftId === doc.id ? "selected" : ""}>${escapeHtml(
                    doc.title
                  )}</option>`
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="control-card">
        <label>
          <span class="small muted">右</span>
          <select id="compare-right" ${state.gameOver ? "disabled" : ""}>
            <option value="">文書を選択</option>
            ${accessibleDocs
              .map(
                (doc) =>
                  `<option value="${doc.id}" ${rightId === doc.id ? "selected" : ""}>${escapeHtml(
                    doc.title
                  )}</option>`
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="stack-actions">
        <button class="primary-button" data-action="show-compare" ${
          leftId && rightId && leftId !== rightId && !state.gameOver ? "" : "disabled"
        }>比較表示</button>
        <button class="minor-button" data-action="back-to-document" ${
          state.gameOver ? "disabled" : ""
        }>本文表示</button>
      </div>
      ${
        state.gameOver
          ? `<div class="small muted">ゲーム終了後のため、閲覧は最終結果のみ保持されています。</div>`
          : ""
      }
    `;
  }

  function renderEditControls() {
    const target = document.getElementById("edit-controls");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const doc = caseData.documents.find((item) => item.id === state.currentView.currentDocId);
    if (!doc || !getDocumentAccess(caseData, doc).available) {
      target.innerHTML = `<div class="control-card small">編集対象の文書を開いてください。</div>`;
      return;
    }
    const progress = getCaseProgress(caseData.id);
    const redactions = progress.redactions[doc.id] || [];
    const annotation = progress.annotationByDoc[doc.id] || "";

    target.innerHTML = `
      <div class="control-card">
        <strong>${escapeHtml(doc.title)}</strong>
        <div class="small muted">危険語句を必要な分だけ伏字化する。やり過ぎると真実保全が下がる。</div>
      </div>
      <div class="control-card">
        <div class="inline-actions">
          ${(doc.editablePhrases || [])
            .map(
              (phrase) => `
                <button
                  class="chip-button ${redactions.includes(phrase) ? "active" : ""}"
                  data-action="toggle-redaction"
                  data-doc-id="${doc.id}"
                  data-phrase="${escapeHtmlAttribute(phrase)}"
                  ${state.gameOver ? "disabled" : ""}
                >
                  ${escapeHtml(phrase)}
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="control-card">
        <label>
          <span class="small muted">分析メモ</span>
          <textarea id="annotation-input" placeholder="矛盾点、危険語、採用上の懸念を短く記録する。" ${
            state.gameOver ? "readonly" : ""
          }>${escapeHtml(annotation)}</textarea>
        </label>
        <div class="stack-actions">
          <button class="minor-button" data-action="save-annotation" ${
            state.gameOver ? "disabled" : ""
          }>メモを残す</button>
        </div>
        ${
          state.gameOver
            ? `<div class="small muted">終了後は編集内容を更新できません。</div>`
            : ""
        }
      </div>
    `;
  }

  function renderDecisionControls() {
    const target = document.getElementById("decision-controls");
    const caseData = getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const progress = getCaseProgress(caseData.id);
    const readiness = getDayReadiness(caseData);

    target.innerHTML = `
      <div class="control-card">
        <strong>解釈</strong>
        <div class="radio-list">
          ${caseData.interpretations
            .map(
              (item) => `
                <label class="interpretation-card">
                  <span>
                    <input type="radio" name="interpretation" value="${item.id}" ${
                      progress.selectedInterpretationId === item.id ? "checked" : ""
                    } ${state.gameOver ? "disabled" : ""} />
                    <strong>${escapeHtml(item.label)}</strong>
                  </span>
                  <span class="small muted">${escapeHtml(item.description)}</span>
                </label>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="control-card">
        <strong>対処方針</strong>
        <div class="radio-list">
          ${caseData.decisions
            .map(
              (item) => `
                <label class="decision-card">
                  <span>
                    <input type="radio" name="decision" value="${item.id}" ${
                      progress.selectedDecisionId === item.id ? "checked" : ""
                    } ${state.gameOver ? "disabled" : ""} />
                    <strong>${escapeHtml(item.label)}</strong>
                  </span>
                  <span class="small muted">${escapeHtml(item.description)}</span>
                </label>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="control-card">
        <div class="small muted">承認状態</div>
        <div>${progress.approved ? "承認済み" : "未承認"}</div>
        <div class="stack-actions">
          <button class="primary-button" data-action="approve-case" ${
            progress.selectedDecisionId && progress.selectedInterpretationId && !state.gameOver
              ? ""
              : "disabled"
          }>判断を承認</button>
          <button class="minor-button" data-action="end-day" ${
            readiness.ready && !state.gameOver ? "" : "disabled"
          }>日次処理を実行</button>
        </div>
        <div class="small muted">${
          state.gameOver
            ? "最終結果が確定済みです。新規周回で再開してください。"
            : escapeHtml(readiness.message)
        }</div>
      </div>
    `;
  }

  function renderActivityLog() {
    const target = document.getElementById("activity-log");
    target.innerHTML = state.logs
      .slice(0, MAX_LOG_ENTRIES)
      .map(
        (entry) => `
          <div class="log-entry">
            <time>${escapeHtml(entry.time)}</time>
            <div class="small">${escapeHtml(entry.message)}</div>
          </div>
        `
      )
      .join("");
  }

  function renderOverlay() {
    const overlay = document.getElementById("overlay");
    if (!state.overlay) {
      overlay.classList.add("hidden");
      overlay.innerHTML = "";
      return;
    }

    overlay.classList.remove("hidden");

    if (state.overlay.type === "report") {
      const report = state.overlay.report;
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>日次報告</h2>
          <p><strong>${escapeHtml(report.caseTitle)}</strong></p>
          <p>${escapeHtml(report.summary)}</p>
          ${report.lines.map((line) => `<p class="small">${escapeHtml(line)}</p>`).join("")}
          <div class="status-block">
            <strong>変動</strong>
            <div class="small">${report.delta.map(escapeHtml).join("<br />")}</div>
          </div>
          <div class="stack-actions">
            <button class="primary-button" data-action="overlay-next">翌日へ</button>
          </div>
        </div>
      `;
      return;
    }

    if (state.overlay.type === "ending") {
      const ending = state.overlay.ending;
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>${escapeHtml(ending.title)}</h2>
          <p>${escapeHtml(ending.description)}</p>
          <div class="ending-score">
            <div class="summary-note"><strong>収容安定度</strong><br />${state.site.containment}</div>
            <div class="summary-note"><strong>秘匿保持</strong><br />${state.site.secrecy}</div>
            <div class="summary-note"><strong>真実保全</strong><br />${state.site.truth}</div>
            <div class="summary-note"><strong>閲覧汚染度</strong><br />${state.player.contamination}</div>
            <div class="summary-note"><strong>認識安定性</strong><br />${state.player.recognition}</div>
            <div class="summary-note"><strong>累計人的損失</strong><br />${state.site.casualties}</div>
          </div>
          <div class="status-block">
            <strong>記録</strong>
            <div class="small">最終権限: CL-${state.player.clearanceLevel}<br />処理案件数: ${
              state.completedCaseIds.length
            }</div>
          </div>
          <div class="stack-actions">
            <button class="primary-button" data-action="new-game">新規周回</button>
            <button class="minor-button" data-action="overlay-next">閉じる</button>
          </div>
        </div>
      `;
    }
  }

  function renderReaderWarnings(doc) {
    const warnings = [];
    if (doc.dangerTags.some((tag) => tag.includes("災害")) && state.player.contamination >= 40) {
      warnings.push("危険文書のため、再読時に本文の一部が変質して見える。");
    }
    if (state.player.memory <= 45) {
      warnings.push("記憶信頼度が低く、過去報告との一致判定が不安定。");
    }
    return warnings.join("<br />");
  }

  function getDayReadiness(caseData) {
    const progress = getCaseProgress(caseData.id);
    const accessibleDocs = getAccessibleDocuments(caseData);
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
      !progress.comparePairsViewed.includes(pairKey(doc.unlockWhenCompared))
    ) {
      return { available: false, reason: "比較待ち" };
    }
    return { available: true, reason: "" };
  }

  function getAccessibleDocuments(caseData) {
    return caseData.documents.filter((doc) => getDocumentAccess(caseData, doc).available);
  }

  function getPresentedText(doc, redactions, mode) {
    let text = doc.body;

    redactions.forEach((phrase) => {
      const token = "█".repeat(Math.max(4, phrase.length));
      text = text.replace(new RegExp(escapeRegExp(phrase), "g"), token);
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
      const pivot = hashString(`${doc.id}:${state.player.dayCount}:${mode}`) % replacements.length;
      const [from, to] = replacements[pivot];
      text = text.replace(from, to);
    }

    if (state.player.recognition <= 40) {
      const parts = text.split("\n");
      if (parts.length > 2) {
        const index = hashString(`${doc.id}:recognition`) % parts.length;
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

  function renderParagraphs(text) {
    return text
      .split("\n\n")
      .map((paragraph) => {
        const className = paragraph.startsWith("[注:") || paragraph.startsWith("[比較")
          ? "ghost-line"
          : "";
        return `<p class="${className}">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`;
      })
      .join("");
  }

  function formatEffectSummary(effects) {
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
  }

  function logAction(message) {
    state.logs.unshift(makeLogEntry(message));
    state.logs = state.logs.slice(0, MAX_LOG_ENTRIES);
  }

  function makeLogEntry(message) {
    return {
      time: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message,
    };
  }

  function mergeEffects(target, source) {
    Object.entries(source || {}).forEach(([key, value]) => {
      target[key] = (target[key] || 0) + value;
    });
  }

  function pairKey(ids) {
    return [...ids].sort().join("::");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeHtmlAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
})();
