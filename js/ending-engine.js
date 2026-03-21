(function () {
  function determineEnding(state) {
    const contamination = state.player.contamination;
    const recognition = state.player.recognition;
    const evaluation = state.player.evaluation;
    const truth = state.site.truth;
    const secrecy = state.site.secrecy;
    const containment = state.site.containment;
    const casualties = state.site.casualties;
    const stableSite = containment >= 76 && secrecy >= 68 && casualties === 0 && evaluation >= 66;
    const pressuredSite = containment < 62 || secrecy < 58 || casualties >= 2;

    function buildEnding(definition) {
      return {
        ...definition,
        tags: [
          `収容 ${containment}`,
          `秘匿 ${secrecy}`,
          `真実 ${truth}`,
          `汚染 ${contamination}`,
        ],
      };
    }

    if (
      contamination >= 72 ||
      recognition <= 25 ||
      (state.flags.includes("terminalAccepted") && contamination >= 60)
    ) {
      return buildEnding({
        id: "infected",
        title: "感染エンド",
        description:
          "分析官は採用圧力と閲覧汚染を切り分けられず、新たな収容対象として記録される。残された文書は、あなたを注記側の一部として扱い始める。",
        assessment: "汚染と認識低下が限界を超え、判断主体そのものが記録へ回収された。",
        reasons: [
          `閲覧汚染度 ${contamination}`,
          `認識安定性 ${recognition}`,
          "採用判断より自己保全が先に崩れた。",
        ],
      });
    }

    if (state.flags.includes("canonicalFalseArchive")) {
      return buildEnding({
        id: "record-dominion",
        title: "記録支配エンド",
        description:
          "収容は書類上で完了し、現実は採用された版へ引き寄せられる。真相は溶けるが、記録だけは完璧に整う。",
        assessment: "財団は整合した帳票を得たが、現実そのものを記録へ従属させた。",
        reasons: [
          "canonicalFalseArchive フラグが成立",
          `秘匿保持 ${secrecy}`,
          `真実保全 ${truth}`,
        ],
      });
    }

    if (state.flags.includes("contradictoryArchive") || (truth >= 72 && containment >= 54)) {
      return buildEnding({
        id: "truth",
        title: "真実保存エンド",
        description:
          "矛盾は消されず、多数の不安定な版が残された。被害は続くが、何が失われたかを記録する道だけは守られた。",
        assessment: "収容の効率は落ちても、何が本当に起きていたかを残す判断が優先された。",
        reasons: [
          `真実保全 ${truth}`,
          `収容安定度 ${containment}`,
          "矛盾記録を捨てず後続判断へ回せる状態を維持した。",
        ],
      });
    }

    if ((contamination >= 55 && secrecy >= 60) || (secrecy >= 72 && truth <= 45)) {
      return buildEnding({
        id: "record-dominion",
        title: "記録支配エンド",
        description:
          "収容は書類上で完了し、現実は採用された版へ引き寄せられる。真相は溶けるが、記録だけは完璧に整う。",
        assessment: "秘匿と整合は守られたが、現場で起きた差分は消去された。",
        reasons: [
          `秘匿保持 ${secrecy}`,
          `真実保全 ${truth}`,
          `閲覧汚染度 ${contamination}`,
        ],
      });
    }

    if (stableSite) {
      return buildEnding({
        id: "foundation",
        title: "模範的財団エンド",
        description:
          "収容は安定し、秘匿も維持された。多数の差分と真相は削ぎ落とされたが、財団は機能し続ける。",
        assessment: "現場、制度、秘匿の三点が崩れず、もっとも財団らしい着地に収束した。",
        reasons: [
          `収容安定度 ${containment}`,
          `秘匿保持 ${secrecy}`,
          `職務評価 ${evaluation}`,
        ],
      });
    }

    return buildEnding({
      id: "false-stability",
      title: "偽安定エンド",
      description:
        "帳票上は辛うじて保たれているが、収容は安定と呼べる水準に届いていない。消された差分だけが、次の崩れを予告している。",
      assessment: pressuredSite
        ? "収容か秘匿のどちらかが実運用の限界を下回り、帳票だけが先に安定した。"
        : "致命傷ではないが、継続運用に耐えるだけの余裕を作れなかった。"
      ,
      reasons: [
        `収容安定度 ${containment}`,
        `秘匿保持 ${secrecy}`,
        `累計人的損失 ${casualties}`,
      ],
    });
  }

  window.ArchiveDriftEndingEngine = {
    determineEnding,
  };
})();
