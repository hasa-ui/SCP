(function () {
  const utils = window.ArchiveDriftUtils;

  function renderApplication(options) {
    const { controller, corruptionEngine, validationReport } = options;
    renderDaySummary(controller, validationReport);
    renderStats(controller);
    renderCases(controller);
    renderDocuments(controller);
    renderReader(controller, corruptionEngine);
    renderCaseSummary(controller);
    renderCompareControls(controller);
    renderEditControls(controller);
    renderDecisionControls(controller);
    renderActivityLog(controller);
    renderDebugPanel(controller, validationReport);
    renderOverlay(controller);
  }

  function renderFatalValidation(validationReport) {
    document.body.innerHTML = `
      <div class="app-shell">
        <section class="panel">
          <h2>Validation Error</h2>
          <p>案件データの整合性検証に失敗したため、起動を停止しました。</p>
          <div class="control-card">
            <strong>Errors</strong>
            <div class="small">${validationReport.errors.map(utils.escapeHtml).join("<br />")}</div>
          </div>
          ${
            validationReport.warnings.length
              ? `<div class="control-card"><strong>Warnings</strong><div class="small">${validationReport.warnings
                  .map(utils.escapeHtml)
                  .join("<br />")}</div></div>`
              : ""
          }
        </section>
      </div>
    `;
  }

  function renderDaySummary(controller, validationReport) {
    const target = document.getElementById("day-summary");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
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
        <strong>${utils.escapeHtml(caseData.title)}</strong>
        <div class="muted small">${utils.escapeHtml(caseData.summary)}</div>
      </div>
      ${
        report
          ? `<div class="status-block small"><strong>前日報告</strong><br />${utils.escapeHtml(
              report.summary
            )}</div>`
          : ""
      }
      ${
        state.storageWarning
          ? `<div class="warning-block small"><strong>セーブ警告</strong><br />${utils.escapeHtml(
              controller.getStorageWarningMessage()
            )}</div>`
          : ""
      }
      <div class="status-block small">
        <strong>Validation</strong><br />
        errors: ${validationReport.errors.length} / warnings: ${validationReport.warnings.length}
      </div>
    `;
  }

  function renderStats(controller) {
    const playerTarget = document.getElementById("player-stats");
    const siteTarget = document.getElementById("site-stats");
    const state = controller.getState();

    const playerStats = {
      recognition: "認識安定性",
      memory: "記憶信頼度",
      contamination: "閲覧汚染度",
      obsession: "執着指数",
      ethics: "倫理負荷",
      evaluation: "職務評価",
    };
    const siteStats = {
      containment: "収容安定度",
      secrecy: "秘匿保持",
      truth: "真実保全",
    };

    playerTarget.innerHTML = Object.entries(playerStats)
      .map(([key, label]) => renderStatCard(label, state.player[key], key === "contamination"))
      .join("");

    siteTarget.innerHTML =
      Object.entries(siteStats)
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

    return `
      <div class="stat-card">
        <div class="stat-head">
          <span>${utils.escapeHtml(label)}</span>
          <span class="mono">${displayValue !== undefined ? displayValue : value}</span>
        </div>
        <div class="stat-track">
          <div class="stat-fill ${cssClass}" style="width:${utils.clamp(value, 0, 100)}%"></div>
        </div>
      </div>
    `;
  }

  function renderCases(controller) {
    const target = document.getElementById("case-list");
    const state = controller.getState();
    target.innerHTML = controller
      .getGameData()
      .cases.map((caseData, index) => {
        const status = state.completedCaseIds.includes(caseData.id)
          ? "処理済"
          : index === state.currentCaseIndex
            ? "進行中"
            : "待機";
        const currentClass = index === state.currentCaseIndex ? "current" : "";
        const progress = controller.getCaseProgress(caseData.id);
        return `
          <article class="case-card ${currentClass}">
            <header>
              <div>
                <div class="small muted">Day ${caseData.day}</div>
                <strong>${utils.escapeHtml(caseData.title)}</strong>
              </div>
              <span class="tag">${status}</span>
            </header>
            <div class="small muted">${utils.escapeHtml(caseData.classification)}</div>
            ${
              progress.outcomeSummary
                ? `<div class="small">${utils.escapeHtml(progress.outcomeSummary)}</div>`
                : `<div class="small muted">${utils.escapeHtml(caseData.summary)}</div>`
            }
          </article>
        `;
      })
      .join("");
  }

  function renderDocuments(controller) {
    const target = document.getElementById("document-list");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }

    const progress = controller.getCaseProgress(caseData.id);
    target.innerHTML = caseData.documents
      .map((doc) => {
        const access = controller.getDocumentAccess(caseData, doc);
        const isActive = state.currentView.currentDocId === doc.id && state.currentView.mode === "document";
        const isRead = progress.readDocs.includes(doc.id);
        return `
          <article class="doc-card ${isActive ? "active" : ""} ${access.available ? "" : "locked"}">
            <header>
              <div>
                <strong>${utils.escapeHtml(doc.title)}</strong>
                <div class="small muted">${utils.escapeHtml(doc.author)} / CL-${doc.clearance}</div>
              </div>
              <span class="tag">${access.available ? (isRead ? "既読" : "未読") : access.reason}</span>
            </header>
            <div class="inline-actions">
              <button class="minor-button" data-action="open-doc" data-doc-id="${doc.id}" ${
                access.available ? "" : "disabled"
              }>開く</button>
              ${doc.dangerTags
                .map((tag) => `<span class="tag small">${utils.escapeHtml(tag)}</span>`)
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderReader(controller, corruptionEngine) {
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    const header = document.getElementById("reader-header");
    const content = document.getElementById("reader-content");

    if (!caseData) {
      header.innerHTML = "";
      content.innerHTML = "";
      return;
    }

    if (state.currentView.mode === "compare") {
      const compareHtml = renderCompareView(controller, corruptionEngine);
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

    const progress = controller.getCaseProgress(caseData.id);
    const redacted = progress.redactions[doc.id] || [];
    const presentedText = corruptionEngine.getPresentedText(doc, redacted, state, "reader");
    const annotation = progress.annotationByDoc[doc.id] || "";
    const warnings = corruptionEngine.getReaderWarnings(doc, state);

    header.innerHTML = `
      <div class="reader-header-top">
        <div>
          <div class="small muted">${utils.escapeHtml(caseData.title)}</div>
          <h2>${utils.escapeHtml(doc.title)}</h2>
        </div>
        <button class="minor-button" data-action="back-to-document">本文表示</button>
      </div>
      <div class="reader-meta">
        <span class="meta-chip">${utils.escapeHtml(doc.author)}</span>
        <span class="meta-chip mono">${utils.escapeHtml(doc.createdAt)}</span>
        <span class="meta-chip">CL-${doc.clearance}</span>
        <span class="meta-chip">${utils.escapeHtml(doc.version)}</span>
        ${doc.dangerTags.map((tag) => `<span class="tag">${utils.escapeHtml(tag)}</span>`).join("")}
      </div>
    `;

    content.innerHTML = `
      ${
        warnings.length
          ? `<div class="warning-block">${warnings.map(utils.escapeHtml).join("<br />")}</div>`
          : ""
      }
      <div class="document-body">${renderParagraphs(presentedText)}</div>
      <div class="status-block">
        <strong>文書注記</strong>
        <div class="small">${doc.notes.map(utils.escapeHtml).join("<br />")}</div>
      </div>
      ${
        annotation
          ? `<div class="annotation-block"><strong>分析官メモ</strong><div class="small">${utils.escapeHtml(
              annotation
            ).replace(/\n/g, "<br />")}</div></div>`
          : ""
      }
      ${
        redacted.length
          ? `<div class="annotation-block small"><strong>現行伏字</strong><br />${redacted
              .map(utils.escapeHtml)
              .join(" / ")}</div>`
          : ""
      }
    `;
  }

  function renderCompareView(controller, corruptionEngine) {
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    const [leftId, rightId] = state.currentView.compareIds;
    const leftDoc = caseData.documents.find((doc) => doc.id === leftId);
    const rightDoc = caseData.documents.find((doc) => doc.id === rightId);
    if (!leftDoc || !rightDoc) {
      return {
        header: `<h2>比較対象が不足しています</h2>`,
        content: `<div class="warning-block">左と右の文書を選択してください。</div>`,
      };
    }

    const progress = controller.getCaseProgress(caseData.id);
    const leftText = corruptionEngine.getPresentedText(leftDoc, progress.redactions[leftId] || [], state, "compare");
    const rightText = corruptionEngine.getPresentedText(
      rightDoc,
      progress.redactions[rightId] || [],
      state,
      "compare"
    );
    const rows = corruptionEngine.buildDiffRows(leftText, rightText);

    return {
      header: `
        <div class="reader-header-top">
          <div>
            <div class="small muted">${utils.escapeHtml(caseData.title)}</div>
            <h2>文書比較</h2>
          </div>
          <button class="minor-button" data-action="back-to-document">本文へ戻る</button>
        </div>
        <div class="reader-meta">
          <span class="meta-chip">${utils.escapeHtml(leftDoc.title)}</span>
          <span class="meta-chip">${utils.escapeHtml(rightDoc.title)}</span>
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
            <div class="diff-head"><strong>${utils.escapeHtml(leftDoc.title)}</strong></div>
            <div class="diff-rows">
              ${rows
                .map(
                  (row) => `<div class="diff-row ${row.changed ? "changed" : ""} ${
                    row.left ? "" : "empty"
                  }">${utils.escapeHtml(row.left || "—")}</div>`
                )
                .join("")}
            </div>
          </div>
          <div class="diff-column">
            <div class="diff-head"><strong>${utils.escapeHtml(rightDoc.title)}</strong></div>
            <div class="diff-rows">
              ${rows
                .map(
                  (row) => `<div class="diff-row ${row.changed ? "changed" : ""} ${
                    row.right ? "" : "empty"
                  }">${utils.escapeHtml(row.right || "—")}</div>`
                )
                .join("")}
            </div>
          </div>
        </div>
      `,
    };
  }

  function renderCaseSummary(controller) {
    const target = document.getElementById("case-summary");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const readiness = controller.getDayReadiness(caseData);
    const notes = (caseData.continuityNotes || [])
      .filter((note) => state.flags.includes(note.flag))
      .map((note) => `<div class="summary-note small">${utils.escapeHtml(note.text)}</div>`)
      .join("");

    target.innerHTML = `
      <div class="control-card">
        <div class="small muted">分類</div>
        <strong>${utils.escapeHtml(caseData.classification)}</strong>
        <div class="small">${utils.escapeHtml(caseData.briefing)}</div>
      </div>
      <div class="control-card">
        <div class="inline-actions">
          <span class="tag">優先度 ${utils.escapeHtml(caseData.priority)}</span>
          <span class="tag">危険度 ${utils.escapeHtml(caseData.riskLevel)}</span>
        </div>
        <div class="small muted">判断準備</div>
        <div class="small">${utils.escapeHtml(readiness.message)}</div>
      </div>
      <div class="control-card">
        <strong>比較ヒント</strong>
        <div class="small">
          ${caseData.compareHints
            .map(
              (hint) =>
                `<div><strong>${utils.escapeHtml(hint.label)}</strong><br />${utils.escapeHtml(
                  hint.hint
                )}</div>`
            )
            .join("<br />")}
        </div>
      </div>
      ${notes}
    `;
  }

  function renderCompareControls(controller) {
    const target = document.getElementById("compare-controls");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const accessibleDocs = controller.getAccessibleDocuments(caseData);
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
                  `<option value="${doc.id}" ${leftId === doc.id ? "selected" : ""}>${utils.escapeHtml(
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
                  `<option value="${doc.id}" ${rightId === doc.id ? "selected" : ""}>${utils.escapeHtml(
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
        <button class="minor-button" data-action="back-to-document" ${state.gameOver ? "disabled" : ""}>本文表示</button>
      </div>
    `;
  }

  function renderEditControls(controller) {
    const target = document.getElementById("edit-controls");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const doc = caseData.documents.find((item) => item.id === state.currentView.currentDocId);
    if (!doc || !controller.getDocumentAccess(caseData, doc).available) {
      target.innerHTML = `<div class="control-card small">編集対象の文書を開いてください。</div>`;
      return;
    }
    const progress = controller.getCaseProgress(caseData.id);
    const redactions = progress.redactions[doc.id] || [];
    const annotation = progress.annotationByDoc[doc.id] || "";

    target.innerHTML = `
      <div class="control-card">
        <strong>${utils.escapeHtml(doc.title)}</strong>
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
                  data-phrase="${utils.escapeHtmlAttribute(phrase)}"
                  ${state.gameOver ? "disabled" : ""}
                >
                  ${utils.escapeHtml(phrase)}
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
          }>${utils.escapeHtml(annotation)}</textarea>
        </label>
        <div class="stack-actions">
          <button class="minor-button" data-action="save-annotation" ${state.gameOver ? "disabled" : ""}>メモを残す</button>
        </div>
      </div>
    `;
  }

  function renderDecisionControls(controller) {
    const target = document.getElementById("decision-controls");
    const state = controller.getState();
    const caseData = controller.getCurrentCase();
    if (!caseData) {
      target.innerHTML = "";
      return;
    }
    const progress = controller.getCaseProgress(caseData.id);
    const readiness = controller.getDayReadiness(caseData);

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
                    <strong>${utils.escapeHtml(item.label)}</strong>
                  </span>
                  <span class="small muted">${utils.escapeHtml(item.description)}</span>
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
                    <strong>${utils.escapeHtml(item.label)}</strong>
                  </span>
                  <span class="small muted">${utils.escapeHtml(item.description)}</span>
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
            progress.selectedDecisionId && progress.selectedInterpretationId && !state.gameOver ? "" : "disabled"
          }>判断を承認</button>
          <button class="minor-button" data-action="end-day" ${
            readiness.ready && !state.gameOver ? "" : "disabled"
          }>日次処理を実行</button>
        </div>
        <div class="small muted">${
          state.gameOver
            ? "最終結果が確定済みです。新規周回で再開してください。"
            : utils.escapeHtml(readiness.message)
        }</div>
      </div>
    `;
  }

  function renderActivityLog(controller) {
    const target = document.getElementById("activity-log");
    const state = controller.getState();
    target.innerHTML = state.logs
      .slice(0, 12)
      .map(
        (entry) => `
          <div class="log-entry">
            <time>${utils.escapeHtml(entry.time)}</time>
            <div class="small">${utils.escapeHtml(entry.message)}</div>
          </div>
        `
      )
      .join("");
  }

  function renderDebugPanel(controller, validationReport) {
    const target = document.getElementById("debug-panel");
    if (!target) {
      return;
    }
    const state = controller.getState();
    const snapshot = controller.buildDebugSnapshot(validationReport);

    if (!state.debug.enabled) {
      target.innerHTML = `
        <div class="control-card small">
          デバッグ表示は無効です。<br />
          validation: errors ${validationReport.errors.length} / warnings ${validationReport.warnings.length}
        </div>
      `;
      return;
    }

    target.innerHTML = `
      <div class="control-card">
        <strong>Runtime</strong>
        <div class="small mono">
          save v${snapshot.saveVersion}<br />
          current case: ${utils.escapeHtml(snapshot.currentCaseId || "-")}<br />
          day: ${snapshot.currentDay}<br />
          storage warning: ${utils.escapeHtml(snapshot.storageWarningReason || "none")}
        </div>
      </div>
      <div class="control-card">
        <strong>Flags</strong>
        <div class="small">${snapshot.flags.length ? snapshot.flags.map(utils.escapeHtml).join("<br />") : "none"}</div>
      </div>
      <div class="control-card">
        <strong>Validation</strong>
        <div class="small">
          checked at ${utils.escapeHtml(validationReport.checkedAt)}<br />
          errors: ${validationReport.errors.length}<br />
          warnings: ${validationReport.warnings.length}
        </div>
        ${
          validationReport.errors.length
            ? `<div class="small">${validationReport.errors.map(utils.escapeHtml).join("<br />")}</div>`
            : ""
        }
        ${
          validationReport.warnings.length
            ? `<div class="small">${validationReport.warnings.map(utils.escapeHtml).join("<br />")}</div>`
            : ""
        }
      </div>
      <div class="control-card">
        <strong>State Snapshot</strong>
        <pre class="debug-pre">${utils.escapeHtml(JSON.stringify(snapshot, null, 2))}</pre>
      </div>
    `;
  }

  function renderOverlay(controller) {
    const overlay = document.getElementById("overlay");
    const state = controller.getState();
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
          <p><strong>${utils.escapeHtml(report.caseTitle)}</strong></p>
          <p>${utils.escapeHtml(report.summary)}</p>
          ${report.lines.map((line) => `<p class="small">${utils.escapeHtml(line)}</p>`).join("")}
          <div class="status-block">
            <strong>変動</strong>
            <div class="small">${report.delta.map(utils.escapeHtml).join("<br />")}</div>
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
          <h2>${utils.escapeHtml(ending.title)}</h2>
          <p>${utils.escapeHtml(ending.description)}</p>
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

  function renderParagraphs(text) {
    return text
      .split("\n\n")
      .map((paragraph) => {
        const className =
          paragraph.startsWith("[注:") || paragraph.startsWith("[比較") ? "ghost-line" : "";
        return `<p class="${className}">${utils.escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`;
      })
      .join("");
  }

  window.ArchiveDriftRenderers = {
    renderApplication,
    renderFatalValidation,
  };
})();
