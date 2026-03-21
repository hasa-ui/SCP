(function () {
  function determineEnding(state) {
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
      (state.flags.includes("terminalAccepted") && contamination >= 60)
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

  window.ArchiveDriftEndingEngine = {
    determineEnding,
  };
})();
