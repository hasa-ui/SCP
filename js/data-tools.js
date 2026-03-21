(function () {
  const utils = window.ArchiveDriftUtils;
  const CURRENT_SAVE_VERSION = 2;
  const REQUIRED_CASE_FIELDS = [
    "id",
    "day",
    "title",
    "classification",
    "riskLevel",
    "priority",
    "summary",
    "briefing",
    "analysisKeywords",
    "truthChoiceId",
    "bestActionId",
    "interpretations",
    "decisions",
    "documents",
  ];
  const REQUIRED_DOCUMENT_FIELDS = [
    "id",
    "title",
    "author",
    "createdAt",
    "clearance",
    "body",
    "version",
    "priorVersionId",
  ];

  function normalizeGameData(rawData) {
    return {
      meta: {
        title: rawData.meta?.title || "SCP: 収容差分",
        subtitle: rawData.meta?.subtitle || "Archive Drift",
        totalDays: rawData.meta?.totalDays || rawData.cases.length,
      },
      initialPlayer: {
        recognition: 78,
        memory: 74,
        contamination: 18,
        obsession: 12,
        ethics: 24,
        evaluation: 62,
        clearanceLevel: 2,
        dayCount: 1,
        ...rawData.initialPlayer,
      },
      initialSite: {
        containment: 58,
        secrecy: 57,
        truth: 46,
        casualties: 0,
        ...rawData.initialSite,
      },
      cases: (rawData.cases || []).map((caseData, index) => normalizeCase(caseData, index)),
    };
  }

  function normalizeCase(caseData, index) {
    return {
      day: index + 1,
      continuityNotes: [],
      analysisKeywords: [],
      compareHints: [],
      interpretations: [],
      decisions: [],
      documents: [],
      safeRedactionLimit: 2,
      ...caseData,
      documents: (caseData.documents || []).map((doc) => normalizeDocument(doc, caseData.id)),
    };
  }

  function normalizeDocument(documentData, caseId) {
    return {
      caseId,
      dangerTags: [],
      notes: [],
      editablePhrases: [],
      unlockWhenRead: null,
      unlockWhenCompared: null,
      ...documentData,
    };
  }

  function buildInitialCaseProgress(gameData) {
    return Object.fromEntries(
      gameData.cases.map((caseData) => [
        caseData.id,
        {
          readDocs: [],
          redactions: {},
          annotationByDoc: {},
          selectedInterpretationId: "",
          selectedDecisionId: "",
          approved: false,
          comparePairsViewed: [],
          outcomeSummary: "",
        },
      ])
    );
  }

  function buildValidationReport(gameData) {
    const errors = [];
    const warnings = [];
    const caseIds = new Set();
    const documentIds = new Set();

    gameData.cases.forEach((caseData) => {
      REQUIRED_CASE_FIELDS.forEach((field) => {
        if (
          caseData[field] === undefined ||
          caseData[field] === null ||
          (Array.isArray(caseData[field]) && caseData[field].length === 0)
        ) {
          errors.push(`case:${caseData.id || "unknown"} missing ${field}`);
        }
      });

      if (caseIds.has(caseData.id)) {
        errors.push(`duplicate case id: ${caseData.id}`);
      }
      caseIds.add(caseData.id);

      const interpretationIds = new Set((caseData.interpretations || []).map((item) => item.id));
      const decisionIds = new Set((caseData.decisions || []).map((item) => item.id));
      const documentIdSet = new Set((caseData.documents || []).map((item) => item.id));

      if (!interpretationIds.has(caseData.truthChoiceId)) {
        errors.push(`case:${caseData.id} invalid truthChoiceId: ${caseData.truthChoiceId}`);
      }

      if (!decisionIds.has(caseData.bestActionId)) {
        errors.push(`case:${caseData.id} invalid bestActionId: ${caseData.bestActionId}`);
      }

      (caseData.compareHints || []).forEach((hint, hintIndex) => {
        if (!Array.isArray(hint.ids) || hint.ids.length !== 2) {
          errors.push(`case:${caseData.id} compareHints[${hintIndex}] must reference exactly 2 docs`);
          return;
        }
        hint.ids.forEach((docId) => {
          if (!documentIdSet.has(docId)) {
            errors.push(`case:${caseData.id} compareHints[${hintIndex}] references missing doc ${docId}`);
          }
        });
      });

      (caseData.documents || []).forEach((documentData) => {
        REQUIRED_DOCUMENT_FIELDS.forEach((field) => {
          if (
            documentData[field] === undefined ||
            documentData[field] === null ||
            (Array.isArray(documentData[field]) && documentData[field].length === 0)
          ) {
            errors.push(`doc:${documentData.id || "unknown"} missing ${field}`);
          }
        });

        if (documentIds.has(documentData.id)) {
          errors.push(`duplicate document id: ${documentData.id}`);
        }
        documentIds.add(documentData.id);

        (documentData.unlockWhenRead || []).forEach((docId) => {
          if (!documentIdSet.has(docId)) {
            errors.push(`doc:${documentData.id} unlockWhenRead references missing doc ${docId}`);
          }
        });

        if (
          documentData.unlockWhenCompared &&
          (!Array.isArray(documentData.unlockWhenCompared) || documentData.unlockWhenCompared.length !== 2)
        ) {
          errors.push(`doc:${documentData.id} unlockWhenCompared must reference exactly 2 docs`);
        }

        (documentData.unlockWhenCompared || []).forEach((docId) => {
          if (!documentIdSet.has(docId)) {
            errors.push(`doc:${documentData.id} unlockWhenCompared references missing doc ${docId}`);
          }
        });

        if ((documentData.editablePhrases || []).length === 0) {
          warnings.push(`doc:${documentData.id} has no editablePhrases`);
        }
      });
    });

    return {
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }

  window.ArchiveDriftDataTools = {
    CURRENT_SAVE_VERSION,
    normalizeGameData,
    buildInitialCaseProgress,
    buildValidationReport,
    deepClone: utils.deepClone,
  };
})();
