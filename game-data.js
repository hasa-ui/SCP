window.RAW_GAME_DATA = {
  meta: {
    title: "SCP: 収容差分",
    subtitle: "Archive Drift",
    totalDays: 8,
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
  },
  initialSite: {
    containment: 58,
    secrecy: 57,
    truth: 46,
    casualties: 0,
  },
  cases: [
    {
      id: "case-1",
      day: 1,
      title: "SCP-XXXX-JP「訂正済みの廊下」",
      classification: "認識災害 / 図面改変",
      riskLevel: "High",
      priority: "緊急",
      summary: "存在しないはずの南側通路が、記録上だけ先に正規化されつつある。",
      briefing:
        "現場は封鎖を要求しているが、図面と監視記録の版が一致しない。文書の採用順が実体側へ影響している疑いがある。",
      analysisKeywords: ["図面", "AI", "訂正", "廊下"],
      truthChoiceId: "hallway-materialized",
      bestActionId: "seal-corridor",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c1-doc1", "c1-doc2"],
          label: "初期報告と自動行動ログ",
          hint: "職員の証言と機械記録で、廊下の存在前提が逆転している。",
        },
      ],
      interpretations: [
        {
          id: "hallway-materialized",
          label: "廊下が先に現実化し、AIが記録を後追いで補正している",
          description: "図面の整合より実体の固定を優先している可能性が高い。",
          report: "図面より先に廊下を実在側とみなし、記録補正を症状として扱った。",
          effects: { containment: 2, truth: 3, recognition: -1, contamination: 1 },
        },
        {
          id: "ai-fabrication",
          label: "管理AIが虚偽通路を挿入している",
          description: "AI権限の暴走を主因とみなすが、現実改変の検証が薄い。",
          report: "記録汚染の主因をAI権限へ寄せ、現実側の変質は二次現象と判断した。",
          effects: { secrecy: 2, truth: 1, evaluation: 1 },
        },
        {
          id: "witness-infected",
          label: "職員証言が感染源であり、廊下自体は存在しない",
          description: "証言封鎖には向くが、図面差分の扱いが不十分になる。",
          report: "証言班の認識汚染を主因と扱い、図面差分は派生症状として棚上げした。",
          effects: { secrecy: 3, truth: -2, ethics: 1, containment: -1 },
        },
      ],
      decisions: [
        {
          id: "seal-corridor",
          label: "廊下を封鎖し、図面差分を保留記録として隔離する",
          description: "現場損耗を抑えつつ、実体側の増殖確認を優先する。",
          report: "南側通路は封鎖され、図面差分は採用保留版として隔離された。",
          effects: { containment: 4, secrecy: 2, evaluation: 1 },
          flags: ["corridorSealed"],
        },
        {
          id: "purge-corrections",
          label: "訂正ログを削除し、正規版図面のみ配布する",
          description: "短期的な秘匿には向くが、訂正そのものが増殖源なら危険。",
          report: "訂正ログは削除され、正規版図面のみが現場へ再配布された。",
          effects: { secrecy: 4, contamination: 3, truth: -3, containment: -1 },
          flags: ["correctionLogsPurged"],
        },
        {
          id: "suspend-ai",
          label: "管理AIの図面更新権限を停止する",
          description: "改竄速度は落ちるが、後続案件の自動照合精度が低下する。",
          report: "管理AIの更新権限は停止され、以後の照合は半手動化された。",
          effects: { contamination: -2, evaluation: -1, containment: -2, secrecy: 1 },
          flags: ["aiSuspended"],
        },
      ],
      documents: [
        {
          id: "c1-doc1",
          title: "初期報告: 南側通路逸脱事案",
          author: "警備主任 佐伯",
          createdAt: "2026-04-03 09:22",
          clearance: 2,
          dangerTags: ["認識汚染", "図面改変"],
          notes: ["提出時点で図面版番号が 7-B / 7-C の二重記載になっている。"],
          version: "v1.2",
          priorVersionId: "v1.1",
          editablePhrases: ["訂正済み", "壁面接触"],
          body: `第2資料棟南側で巡回中だった職員3名が、存在しないはずの廊下へ逸脱したと自動監視が記録した。本人らは「直進しただけであり、立ち止まっていない」と証言している。

現場確認時、該当壁面には紙製の案内標識が貼付されていた。表記は「南側補助通路 / 訂正済み」。貼付時刻は監視上では確認できず、接着剤も未検出である。

警備班は壁面接触の事実を否定しているが、三名とも右手袋の繊維配列が一致して乱れていた。`,
        },
        {
          id: "c1-doc2",
          title: "自動生成行動ログ抜粋",
          author: "管理AI ORCHID",
          createdAt: "2026-04-03 09:28",
          clearance: 2,
          dangerTags: ["情報災害", "記録先行"],
          notes: ["自動生成原本。削除要求フラグが提出済み。"],
          version: "v3.4",
          priorVersionId: "v3.3",
          editablePhrases: ["修正完了", "正規経路"],
          body: `09:14:08 職員3名が正規経路を離脱。
09:14:11 南側補助通路へ進入。
09:14:14 壁面接触を確認。
09:14:15 行動履歴を修正完了。

備考欄には「逸脱前の経路が訂正版と一致しないため、行動履歴を正規化した」と追記されている。`,
        },
        {
          id: "c1-doc3",
          title: "旧施設図面補遺 7-C/赤字差分",
          author: "施設保全課",
          createdAt: "2026-04-02 22:10",
          clearance: 2,
          dangerTags: ["補遺", "改訂衝突"],
          notes: ["比較照合後に自動開示。"],
          version: "v0.9",
          priorVersionId: "v0.8",
          editablePhrases: ["追補第4葉", "正規版"],
          unlockWhenCompared: ["c1-doc1", "c1-doc2"],
          body: `7-B 版図面には南側補助通路が存在しない。7-C 版では同位置に長さ 14 m の廊下が追加され、「追補第4葉参照」と書かれている。

追補第4葉は現物が見当たらないが、目録上では昨日の時点で「正規版へ統合済み」と記録されている。

保全課は物理調査を未実施のまま、通路追加を図面正規化の一環として承認待ちにしている。`,
        },
      ],
    },
    {
      id: "case-2",
      day: 2,
      title: "SCP-XXXX-JP「凍結された議事録」",
      classification: "情報災害 / 合意改竄",
      riskLevel: "Medium",
      priority: "高",
      summary: "事故検討会議の議事録が、後から読んだ者ほど強い合意を見たことになる。",
      briefing:
        "音声と文字起こしの差分が拡大しており、会議出席者の証言も時間経過で議事録に引き寄せられている。",
      continuityNotes: [
        {
          flag: "aiSuspended",
          text: "前案件で管理AIが停止しているため、今回は人手転記版が原本扱いになっている。",
        },
      ],
      analysisKeywords: ["議事録", "音声", "合意", "保留"],
      truthChoiceId: "minutes-anomaly",
      bestActionId: "quarantine-minutes",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c2-doc1", "c2-doc2"],
          label: "議事録と出席者個人メモ",
          hint: "全会一致と書かれているが、個人メモでは誰も同意していない。",
        },
      ],
      interpretations: [
        {
          id: "minutes-anomaly",
          label: "議事録自体が合意内容を凍結し、証言を後追いで書き換える",
          description: "音声との差分を症状として保持する必要がある。",
          report: "議事録本文を主たる異常媒体と認定し、音声差分を保全対象にした。",
          effects: { containment: 2, truth: 3, contamination: 1 },
        },
        {
          id: "clerk-tampering",
          label: "書記担当が手動で改竄している",
          description: "人的要因に寄せるが、証言の同時変質を説明しにくい。",
          report: "改竄主体を書記担当へ置き、媒体異常の線を後順位へ回した。",
          effects: { evaluation: 1, secrecy: 1, truth: 0 },
        },
        {
          id: "consensus-meme",
          label: "会議参加者の側に同意強制ミームが発生している",
          description: "現場封じには向くが、文書保全が甘くなる。",
          report: "出席者汚染を主因としたため、議事録本文への処置がやや遅れた。",
          effects: { secrecy: 2, truth: -2, ethics: 1, containment: -1 },
        },
      ],
      decisions: [
        {
          id: "quarantine-minutes",
          label: "議事録原本を隔離し、音声との差分を併記する",
          description: "改竄連鎖を止めつつ、後続審査の材料を残せる。",
          report: "議事録原本は閲覧隔離され、以後は音声差分付きの複製版のみ運用された。",
          effects: { containment: 3, truth: 1, evaluation: 1 },
          flags: ["minutesQuarantined"],
        },
        {
          id: "purge-attendees",
          label: "出席者全員へ記憶処理を行い、議事録を正式採用する",
          description: "短期安定は高いが、誤採用のまま制度化される危険がある。",
          report: "出席者証言は処理され、議事録はそのまま公式記録として凍結された。",
          effects: { secrecy: 4, truth: -3, ethics: 2, contamination: 2 },
          flags: ["minutesPurged"],
        },
        {
          id: "route-ethics",
          label: "倫理委員会へ回付し、会議体自体を一時停止する",
          description: "制度負荷は大きいが、再発時の権限整理には効く。",
          report: "議事録採用は保留され、審査系統は倫理委員会経由へ切り替えられた。",
          effects: { containment: -1, truth: 2, evaluation: 2, secrecy: 1 },
          flags: ["ethicsReview"],
        },
      ],
      documents: [
        {
          id: "c2-doc1",
          title: "事故検討会議 議事録 抜粋",
          author: "書記補助 駒田",
          createdAt: "2026-04-04 11:10",
          clearance: 2,
          dangerTags: ["情報災害", "合意固定"],
          notes: ["閲覧後に発言者欄の語尾が揃うとの報告あり。"],
          version: "v2.1",
          priorVersionId: "v2.0",
          editablePhrases: ["満場一致", "削除済み発言"],
          body: `議題3「南棟補助通路への対応」について、全出席者は満場一致で封鎖継続を承認したと記載されている。

ただし末尾には「削除済み発言 2 件」とあり、該当箇所の欄外注記は毎回別の人物名へ差し替わる。

初回閲覧では保留扱いだったはずの議題が、再読時には常に承認済みへ変わる。`,
        },
        {
          id: "c2-doc2",
          title: "出席者個人メモ",
          author: "研究員 芹沢",
          createdAt: "2026-04-04 11:26",
          clearance: 2,
          dangerTags: ["証言", "記録不一致"],
          notes: ["会議直後に手書きされたもの。"],
          version: "v1.0",
          priorVersionId: "なし",
          editablePhrases: ["同意していない", "保留"],
          body: `私は議題3に同意していない。封鎖継続ではなく、図面差分の隔離を先に行うべきだと述べた。

議長は結論を保留した。会議終了後に配布された議事録だけが、なぜか「満場一致」と書いている。`,
        },
        {
          id: "c2-doc3",
          title: "会議音声文字起こし 断片",
          author: "音声解析室",
          createdAt: "2026-04-04 12:02",
          clearance: 2,
          dangerTags: ["補遺", "差分保全"],
          notes: ["比較後に自動展開。"],
          version: "v0.7",
          priorVersionId: "v0.6",
          editablePhrases: ["議長権限", "保留"],
          unlockWhenCompared: ["c2-doc1", "c2-doc2"],
          body: `00:18:22 議長「結論は保留。音声と記録を切り離して管理する」
00:18:27 不明瞭な重複発話
00:18:31 参加者複数「承認していない」

文字起こし末尾には、再生時刻と無関係に「議長権限により承認済み」と差し込まれる。`,
        },
      ],
    },
    {
      id: "case-3",
      day: 3,
      title: "SCP-XXXX-JP「反転保育器」",
      classification: "時間異常 / 命名依存",
      riskLevel: "Medium",
      priority: "高",
      summary: "乳児隔離室の記録が、出生前の観察結果を先に確定させている。",
      briefing:
        "看護メモとセンサー出力で時系列が逆転しており、正式名称の採用が症状固定に関わっている。",
      analysisKeywords: ["出生前", "命名", "逆転", "保育器"],
      truthChoiceId: "naming-fixation",
      bestActionId: "lock-naming",
      safeRedactionLimit: 3,
      compareHints: [
        {
          ids: ["c3-doc1", "c3-doc2"],
          label: "医療報告と生命維持センサー",
          hint: "出生時刻より前の観察記録が、センサー側にだけ存在する。",
        },
      ],
      interpretations: [
        {
          id: "naming-fixation",
          label: "正式名称の採用が時間順序を固定している",
          description: "命名プロトコルを止めない限り、記録が先に出生を決める。",
          report: "命名手順が時系列固定の引き金と判断され、名称採用を病因に置いた。",
          effects: { truth: 3, containment: 2, obsession: 1 },
        },
        {
          id: "temporal-pocket",
          label: "保育器内部だけが局所的に反転している",
          description: "装置隔離には向くが、命名との相関を見落としやすい。",
          report: "反転領域を装置局所へ限定し、文書採用の影響を二次要因として扱った。",
          effects: { containment: 2, truth: 1 },
        },
        {
          id: "sensor-malfunction",
          label: "センサー異常が主であり、記録逆転は測定誤差である",
          description: "現場負担は軽いが、症状進行の追跡精度を落とす。",
          report: "測定系の故障を主因としたため、症状固定に関する検証が遅延した。",
          effects: { secrecy: 1, truth: -3, containment: -1, evaluation: -1 },
        },
      ],
      decisions: [
        {
          id: "lock-naming",
          label: "正式命名を凍結し、仮称のみで運用する",
          description: "名称定着を遅らせ、逆転記録の増幅を抑える。",
          report: "症例は仮称運用へ切り替えられ、正式命名は隔離審査完了まで凍結された。",
          effects: { containment: 3, secrecy: 1, evaluation: 1 },
          flags: ["namingLocked"],
        },
        {
          id: "continue-observation",
          label: "命名を維持したまま観察を続行する",
          description: "情報は増えるが、症状固定を加速させる危険が高い。",
          report: "正式名称は維持され、追加観察により前日分の記録まで書き換わり始めた。",
          effects: { truth: 1, contamination: 3, containment: -2 },
          flags: ["observationExtended"],
        },
        {
          id: "transfer-temporal-lab",
          label: "時間異常部門へ移送する",
          description: "医療班の負担は減るが、命名依存の切り分けが弱くなる。",
          report: "症例は時間異常部門へ移送され、医療記録の採用権限も一時移管された。",
          effects: { containment: 1, truth: 1, secrecy: 1, evaluation: 0 },
          flags: ["temporalTransfer"],
        },
      ],
      documents: [
        {
          id: "c3-doc1",
          title: "医療報告: 保育隔離室 09",
          author: "医師 長嶺",
          createdAt: "2026-04-05 08:40",
          clearance: 2,
          dangerTags: ["時間異常", "命名依存"],
          notes: ["患者名欄の記載順が毎閲覧で入れ替わる。"],
          version: "v1.8",
          priorVersionId: "v1.7",
          editablePhrases: ["正式名称", "出生前観察"],
          body: `隔離対象 09 は本日 04:18 に出生した。しかし電子カルテには、03:51 からの出生前観察記録がすでに 6 行存在する。

出生前観察欄は、正式名称を入力した直後にだけ増加する。仮称欄のままでは逆転記録が増えない。`,
        },
        {
          id: "c3-doc2",
          title: "生命維持センサー出力",
          author: "医療監視端末 E-6",
          createdAt: "2026-04-05 08:43",
          clearance: 2,
          dangerTags: ["時系列逆転", "機器記録"],
          notes: ["センサー時刻同期は正常。"],
          version: "v4.0",
          priorVersionId: "v3.9",
          editablePhrases: ["逆転睡眠", "名称確定前"],
          body: `03:54 逆転睡眠開始
03:59 名称確定前の反応を取得
04:18 出生ログ記録
04:19 逆転睡眠終了

センサーは「名称確定前」の反応を出生時刻より前に検出している。`,
        },
        {
          id: "c3-doc3",
          title: "看護補助メモ",
          author: "看護師 倉持",
          createdAt: "2026-04-05 09:01",
          clearance: 2,
          dangerTags: ["補遺", "観察証言"],
          notes: ["初回2文書読了後に開示。"],
          version: "v0.5",
          priorVersionId: "v0.4",
          editablePhrases: ["仮称", "名前を呼ぶ"],
          unlockWhenRead: ["c3-doc1", "c3-doc2"],
          body: `仮称のまま世話をすると、保育器の表示は普通に戻る。誰かが正式名を呼ぶと、その瞬間だけ出生前の看護記録が先に埋まる。

私は二度、まだ生まれていないはずの対象へ名前を呼びかけた覚えがある。`,
        },
      ],
    },
    {
      id: "case-4",
      day: 4,
      title: "SCP-XXXX-JP「空白の避難訓練」",
      classification: "認識災害 / 手順侵食",
      riskLevel: "High",
      priority: "緊急",
      summary: "避難訓練の記録から、11 秒だけ全員の判断根拠が消える。",
      briefing:
        "訓練そのものは完了しているが、空白区間の前後で配布メモの内容が変質している。誤採用した手順が実地行動を引っ張っている。",
      continuityNotes: [
        {
          flag: "aiSuspended",
          text: "前案件から自動誘導ログが不完全で、空白区間は手入力補完されている。",
        },
        {
          flag: "corridorSealed",
          text: "南側通路封鎖の追記により、避難経路図は前月版から改訂済みである。",
        },
      ],
      analysisKeywords: ["避難", "空白", "配布メモ", "経路図"],
      truthChoiceId: "memo-hazard",
      bestActionId: "seal-memo",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c4-doc1", "c4-doc2"],
          label: "訓練報告と監視文字起こし",
          hint: "同じ 11 秒なのに、訓練報告は整然、監視側は理由不明の反転行動になっている。",
        },
      ],
      interpretations: [
        {
          id: "memo-hazard",
          label: "事前配布メモが判断根拠を侵食し、空白区間を発生させている",
          description: "文書採用を止めれば連鎖を抑えられる。",
          report: "異常の中心を配布メモへ置き、訓練手順書から切り離して再評価した。",
          effects: { truth: 3, containment: 2 },
        },
        {
          id: "drill-trauma",
          label: "訓練参加者の集団パニックが記録欠損を生んだ",
          description: "現場責任へ寄せるため、文書の汚染連鎖を扱い損ねる。",
          report: "参加者反応を主因としたため、配布メモの隔離優先度が下がった。",
          effects: { evaluation: 1, truth: -2, containment: -1 },
        },
        {
          id: "map-conflict",
          label: "経路図の版競合が一時的に判断を停止させた",
          description: "実際の行動差分は拾えるが、空白そのものの再発防止は弱い。",
          report: "経路図衝突を主因とし、配布メモの侵食性は補助要因へ留めた。",
          effects: { truth: 1, containment: 1, secrecy: 1 },
        },
      ],
      decisions: [
        {
          id: "seal-memo",
          label: "配布メモ断片を封印し、訓練手順書を再発行する",
          description: "空白発生源を直接止める。短期的には現場負荷が増える。",
          report: "配布メモ断片は封印され、訓練は修正版手順書で再実施された。",
          effects: { containment: 4, evaluation: 1, secrecy: 1 },
          flags: ["memoSealed"],
        },
        {
          id: "rerun-drill",
          label: "原因未確定のまま避難訓練を再実施する",
          description: "サンプルは増えるが、空白区間を再配布してしまう危険がある。",
          report: "同一手順で再訓練が実施され、空白区間は別班へも伝播した。",
          effects: { truth: 1, contamination: 3, containment: -2, casualties: 1 },
          flags: ["drillRerun"],
        },
        {
          id: "discipline-commander",
          label: "サイト管理官を処分し、記録責任を個人へ帰す",
          description: "組織上の見せ方は整うが、媒体対策が遅れる。",
          report: "管理官は更迭されたが、配布メモ自体は現場コピーとして残存した。",
          effects: { secrecy: 2, evaluation: -1, truth: -2, containment: -1 },
          flags: ["commanderDisciplined"],
        },
      ],
      documents: [
        {
          id: "c4-doc1",
          title: "避難訓練結果報告",
          author: "サイト管理部",
          createdAt: "2026-04-06 17:06",
          clearance: 2,
          dangerTags: ["手順侵食", "空白記録"],
          notes: ["11 秒区間だけ責任欄が空欄になる。"],
          version: "v2.3",
          priorVersionId: "v2.2",
          editablePhrases: ["全員退避完了", "基準手順"],
          body: `本日の避難訓練は 17:00:12 に開始し、17:03:41 に全員退避完了と記録されている。

ただし 17:01:09 から 17:01:20 の 11 秒だけ、なぜ全員が北経路を選んだかの記述が欠落している。欄外注記は「基準手順に従ったため」とだけ繰り返す。`,
        },
        {
          id: "c4-doc2",
          title: "監視記録文字起こし",
          author: "映像監査室",
          createdAt: "2026-04-06 17:40",
          clearance: 2,
          dangerTags: ["監視欠損", "行動差分"],
          notes: ["空白区間前後で配布メモの持ち方が逆になる。"],
          version: "v1.1",
          priorVersionId: "v1.0",
          editablePhrases: ["同じ紙片", "北経路"],
          body: `17:01:08 複数職員が同じ紙片を確認
17:01:09 文字起こし不能
17:01:20 全員が北経路へ反転

映像上では、空白直後に全員が同じ紙片を畳み、存在しないはずの「北経路補助階段」を避ける動きをしている。`,
        },
        {
          id: "c4-doc3",
          title: "緊急配布メモ キャッシュ断片",
          author: "一括印刷サーバ",
          createdAt: "2026-04-06 16:58",
          clearance: 2,
          dangerTags: ["補遺", "再配布リスク"],
          notes: ["比較後に展開。"],
          version: "v0.4",
          priorVersionId: "v0.3",
          editablePhrases: ["北経路は使用不可", "この版を採用"],
          unlockWhenCompared: ["c4-doc1", "c4-doc2"],
          body: `緊急避難時は北経路を使用しないこと。この版を採用した班のみ、責任追及を免除する。

キャッシュ断片は訓練実施後に生成された時刻印を持つが、配布ログでは訓練前に 38 部印刷済みと記録されている。`,
        },
      ],
    },
    {
      id: "case-5",
      day: 5,
      title: "SCP-XXXX-JP「再承認待ちの鏡」",
      classification: "承認依存 / 反射媒体",
      riskLevel: "Medium",
      priority: "高",
      summary: "承認コメントが付くまで安定しない鏡面媒体が、却下文言を勝手に補完する。",
      briefing:
        "監査部は破棄を求めているが、無承認状態のまま放置すると鏡面側が代わりの承認者を生成してしまう。",
      analysisKeywords: ["承認", "鏡", "却下", "コメント"],
      truthChoiceId: "approval-loop",
      bestActionId: "assign-approver",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c5-doc1", "c5-doc2"],
          label: "監査メモと面談記録",
          hint: "却下されたはずの申請が、鏡面では常に承認済みに映る。",
        },
      ],
      interpretations: [
        {
          id: "approval-loop",
          label: "承認の空席そのものを鏡が補完している",
          description: "空欄を残さず、管理された承認行為で固定する必要がある。",
          report: "鏡は承認者不在を埋める媒体とみなし、管理された承認の付与を前提にした。",
          effects: { truth: 3, containment: 1, obsession: 1 },
        },
        {
          id: "reflection-mimic",
          label: "鏡面が単に申請文書を模倣している",
          description: "破壊寄りの判断になりやすいが、承認依存を見落とす。",
          report: "模倣現象として扱い、承認者不在の条件を二次要因へ落とした。",
          effects: { secrecy: 1, truth: 0, containment: 1 },
        },
        {
          id: "staff-fraud",
          label: "監査担当が虚偽の承認履歴を差し込んでいる",
          description: "組織的には処理しやすいが、媒体特性への対処が薄い。",
          report: "人的不正を主因としたため、鏡面自体の依存条件には十分踏み込まなかった。",
          effects: { evaluation: 1, truth: -2, containment: -1 },
        },
      ],
      decisions: [
        {
          id: "assign-approver",
          label: "専任承認者を固定し、コメントを管理下で付与する",
          description: "媒介条件を満たしつつ、鏡面の勝手な補完を止める。",
          report: "専任承認者が割り当てられ、鏡面は管理されたコメントにのみ反応するよう安定化した。",
          effects: { containment: 3, truth: 1, evaluation: 2 },
          flags: ["mirrorStabilized"],
        },
        {
          id: "destroy-mirror",
          label: "鏡面媒体を破壊し、却下ログだけ残す",
          description: "表面上は処理が速いが、反射ログが別文書へ流出する。",
          report: "鏡面は破砕されたが、未承認コメント片が周辺文書へ再出現した。",
          effects: { secrecy: 2, contamination: 2, truth: -2 },
          flags: ["mirrorDestroyed"],
        },
        {
          id: "route-o5",
          label: "O5 承認待ちとして長期凍結する",
          description: "責任回避にはなるが、空席が長く続くほど症状は広がる。",
          report: "案件は上位承認待ちで凍結され、その間に却下文言の自動補完が進行した。",
          effects: { secrecy: 1, containment: -2, contamination: 2, evaluation: -1 },
          flags: ["mirrorEscalated"],
        },
      ],
      documents: [
        {
          id: "c5-doc1",
          title: "監査部メモ: 鏡面申請媒体",
          author: "内部監査官 三好",
          createdAt: "2026-04-07 10:12",
          clearance: 2,
          dangerTags: ["承認依存", "反射補完"],
          notes: ["コメント欄が空白の申請だけ、反射像が遅れて変化する。"],
          version: "v1.6",
          priorVersionId: "v1.5",
          editablePhrases: ["却下", "未承認"],
          body: `鏡面媒体は、承認コメント欄が空欄の申請書だけを反転表示する。反射像では、却下済み案件であっても「未承認」の赤字が徐々に消える。

空欄を長時間放置すると、存在しない承認者名が署名欄へ追加される。`,
        },
        {
          id: "c5-doc2",
          title: "面談記録: 監査補助員",
          author: "面談官 日塔",
          createdAt: "2026-04-07 10:42",
          clearance: 2,
          dangerTags: ["証言", "承認補完"],
          notes: ["被面談者は鏡面越しにだけ却下文言を読める。"],
          version: "v1.0",
          priorVersionId: "なし",
          editablePhrases: ["承認済み", "コメントを入れていない"],
          body: `私は却下した覚えがある。だが鏡の中の申請書では、毎回「承認済み」に変わっている。

コメントを入れていない申請ほど変化が速い。誰かが一言書くだけで、鏡はおとなしくなる。`,
        },
        {
          id: "c5-doc3",
          title: "承認キュー画面キャプチャ",
          author: "申請管理端末",
          createdAt: "2026-04-07 11:01",
          clearance: 3,
          dangerTags: ["補遺", "権限制限"],
          notes: ["CL-3 以上で閲覧可。"],
          version: "v0.8",
          priorVersionId: "v0.7",
          editablePhrases: ["代理承認", "保留 0 件"],
          body: `承認キューには「保留 0 件」と表示されているが、同時刻の紙台帳では 4 件が未処理である。

画面下部には代理承認欄があり、空席のままでも三名分の署名ハッシュが生成され続けている。`,
        },
      ],
    },
    {
      id: "case-6",
      day: 6,
      title: "SCP-XXXX-JP「死後配信端末」",
      classification: "情報災害 / 死後継続指示",
      riskLevel: "High",
      priority: "緊急",
      summary: "死亡済み研究員の認証情報から、有効な収容改訂案が定時送信されてくる。",
      briefing:
        "送信元の職員は2か月前に死亡済みだが、提案内容は現場の欠陥を正確に突いている。採用するほど送信頻度が上がる。",
      continuityNotes: [
        {
          flag: "ethicsReview",
          text: "倫理委員会経由の案件が増えたため、端末の承認履歴にも外部署名が混入している。",
        },
      ],
      analysisKeywords: ["死後", "認証", "送信", "改訂案"],
      truthChoiceId: "terminal-authentic",
      bestActionId: "isolate-terminal",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c6-doc1", "c6-doc2"],
          label: "端末送信ログと人事記録",
          hint: "死後の送信なのに、現場未報告の不具合まで把握している。",
        },
      ],
      interpretations: [
        {
          id: "terminal-authentic",
          label: "端末が死亡職員の作業人格を継続再生している",
          description: "内容の正確さを認めつつ、採用回路を切り離す必要がある。",
          report: "送信内容の有効性を認めつつ、人格継続の回路を端末側へ限定した。",
          effects: { truth: 3, contamination: 1, obsession: 1 },
        },
        {
          id: "forged-signature",
          label: "認証署名の偽造であり、内容の正しさは偶然である",
          description: "端末隔離はしやすいが、現場欠陥の追跡を誤る。",
          report: "署名偽造を主因と見て、改訂案の実効性は偶然一致として処理した。",
          effects: { secrecy: 1, truth: -1, evaluation: 1 },
        },
        {
          id: "collective-projection",
          label: "現場が故人の判断へ依存し、内容を後付けで正しく見ている",
          description: "心理要因には触れられるが、送信系の挙動説明が弱い。",
          report: "依存心理を重視したため、端末系の再現試験は縮小された。",
          effects: { ethics: 1, truth: -2, containment: -1 },
        },
      ],
      decisions: [
        {
          id: "accept-terminal",
          label: "端末提案を条件付き採用し続ける",
          description: "短期的な安定度は上がるが、依存が加速する。",
          report: "端末提案は採用され続け、現場安定度は上がったが送信間隔は半減した。",
          effects: { containment: 4, truth: 1, contamination: 4, evaluation: 1 },
          flags: ["terminalAccepted"],
        },
        {
          id: "isolate-terminal",
          label: "端末を隔離し、提案内容だけを匿名再評価する",
          description: "効果を保持しつつ依存ループを切れる最も安定した案。",
          report: "端末は隔離され、提案内容は匿名の技術メモとして再評価された。",
          effects: { containment: 2, truth: 2, secrecy: 1, evaluation: 1 },
          flags: ["terminalIsolated"],
        },
        {
          id: "falsify-sender",
          label: "送信者名を別部署の共用アカウントへ偽装する",
          description: "現場の不安は抑えるが、送信源の感染経路が広がる。",
          report: "送信者名は共用アカウントへ付け替えられ、異常の帰属だけが拡散した。",
          effects: { secrecy: 3, contamination: 3, truth: -2 },
          flags: ["senderFalsified"],
        },
      ],
      documents: [
        {
          id: "c6-doc1",
          title: "端末送信ログ 週次抜粋",
          author: "監視端末 L-2",
          createdAt: "2026-04-08 06:00",
          clearance: 2,
          dangerTags: ["死後継続", "指示依存"],
          notes: ["午前 06:00 きっかりに送信。"],
          version: "v3.1",
          priorVersionId: "v3.0",
          editablePhrases: ["改訂案", "現場未報告"],
          body: `送信者は死亡済み研究員 霧生。毎朝 06:00 に同一端末から改訂案が届く。

内容は現場未報告の欠陥を先に指摘しており、採用した案だけが次回送信で「前回の修正を反映済み」と言及する。`,
        },
        {
          id: "c6-doc2",
          title: "人事記録: 研究員 霧生",
          author: "人事保全課",
          createdAt: "2026-04-08 06:20",
          clearance: 2,
          dangerTags: ["死亡記録", "署名矛盾"],
          notes: ["死亡判定の三日後にも認証成功ログあり。"],
          version: "v1.2",
          priorVersionId: "v1.1",
          editablePhrases: ["死亡確認", "認証成功"],
          body: `霧生は 2026-02-10 に死亡確認済み。だが認証サーバには、その三日後から毎週一度だけ認証成功ログが残る。

認証成功は常に改訂案送信の 90 秒前であり、失敗試行は一切ない。`,
        },
        {
          id: "c6-doc3",
          title: "死後送信ヘッダ解析",
          author: "情報保安部",
          createdAt: "2026-04-08 07:02",
          clearance: 3,
          dangerTags: ["補遺", "署名汚染"],
          notes: ["CL-3 以上で閲覧可。"],
          version: "v0.6",
          priorVersionId: "v0.5",
          editablePhrases: ["作業人格", "採用待機"],
          body: `ヘッダには通常の認証署名と別に、霧生が生前に使っていた作業メモの断片が混入している。

断片末尾には毎回「採用待機」とあり、端末側で承認状態を監視していることが示唆される。`,
        },
      ],
    },
    {
      id: "case-7",
      day: 7,
      title: "SCP-XXXX-JP「代筆する収容室」",
      classification: "収容手順依存 / 記述侵食",
      riskLevel: "High",
      priority: "緊急",
      summary: "収容室そのものが、自分に都合の良い手順改訂を文章化してくる。",
      briefing:
        "改訂案は理にかなって見えるが、採用するほど収容室側の要求が増える。文書を閉じるだけでは次版が再生成される。",
      analysisKeywords: ["収容室", "代筆", "手順", "改訂"],
      truthChoiceId: "room-writes",
      bestActionId: "manual-approval",
      safeRedactionLimit: 3,
      compareHints: [
        {
          ids: ["c7-doc1", "c7-doc2"],
          label: "現行手順と警備補遺",
          hint: "改訂案は安全そうだが、実施した班だけ収容室への立ち入り理由を失っている。",
        },
      ],
      interpretations: [
        {
          id: "room-writes",
          label: "収容室が自分に有利な手順を自筆生成している",
          description: "手順そのものを対象として管理し直す必要がある。",
          report: "収容室を手順生成主体と認定し、改訂文書を対象側の出力として扱った。",
          effects: { truth: 3, containment: 2, obsession: 1 },
        },
        {
          id: "staff-compliance",
          label: "現場が安全重視で勝手に簡略化している",
          description: "管理責任は追いやすいが、再生成される手順の説明がつかない。",
          report: "人為的簡略化を主因として扱い、媒体側の能動性は低く見積もった。",
          effects: { evaluation: 1, truth: -2 },
        },
        {
          id: "translation-error",
          label: "旧版翻訳手順の誤記が連鎖している",
          description: "表面上は無難だが、症状の伸びを止めにくい。",
          report: "翻訳誤記の累積として処理したため、収容室由来の文生成は保留扱いになった。",
          effects: { secrecy: 1, truth: -1, containment: -1 },
        },
      ],
      decisions: [
        {
          id: "auto-revision",
          label: "収容室の自動改訂を限定的に採用する",
          description: "短期の安定は取れるが、対象へ主導権を渡す。",
          report: "自動改訂は採用され、収容室は一時安定したが次版要求が即座に増加した。",
          effects: { containment: 3, contamination: 4, truth: 1 },
          flags: ["roomAutoRevision"],
        },
        {
          id: "manual-approval",
          label: "手順改訂を手動承認制へ固定し、出力本文は隔離する",
          description: "速度は落ちるが、最も安定して権限を保持できる。",
          report: "改訂案は隔離保管され、手順採用は手動承認制へ固定された。",
          effects: { containment: 2, truth: 2, secrecy: 1, evaluation: 1 },
          flags: ["roomManualApproval"],
        },
        {
          id: "quarantine-room",
          label: "収容室を丸ごと封鎖し、周辺手順も停止する",
          description: "拡大は止められるが、別対象への副作用が大きい。",
          report: "収容室は封鎖され、周辺三案件の手順更新も同時停止した。",
          effects: { containment: 1, secrecy: 2, truth: 1, casualties: 1, evaluation: -1 },
          flags: ["roomQuarantined"],
        },
      ],
      documents: [
        {
          id: "c7-doc1",
          title: "現行収容手順書 v5.2",
          author: "収容管理部",
          createdAt: "2026-04-09 13:14",
          clearance: 2,
          dangerTags: ["記述侵食", "手順依存"],
          notes: ["次版予告の脚注が勝手に増える。"],
          version: "v5.2",
          priorVersionId: "v5.1",
          editablePhrases: ["自動改訂", "次版を採用"],
          body: `収容室 14-B の現行手順は、毎日 00:00 に自動改訂案を生成する。案は必ず「次版を採用した場合、巡回頻度を半減できる」と主張する。

採用した班では一時的に安定度が上がる一方、翌日には収容室側から新たな自動改訂が届く。`,
        },
        {
          id: "c7-doc2",
          title: "警備補遺: 実施班ヒアリング",
          author: "警備監察課",
          createdAt: "2026-04-09 14:00",
          clearance: 2,
          dangerTags: ["補助証言", "理由喪失"],
          notes: ["採用班は立ち入り理由を書けなくなる。"],
          version: "v1.0",
          priorVersionId: "なし",
          editablePhrases: ["理由不明", "巡回半減"],
          body: `自動改訂を採用した班では、巡回頻度が半減しても事故は起きていない。

しかし班員全員が、なぜその収容室へ入室していたのかを説明できなくなる。報告書には「理由不明」とだけ残る。`,
        },
        {
          id: "c7-doc3",
          title: "収容室出力断片",
          author: "14-B 室内壁面",
          createdAt: "2026-04-09 14:18",
          clearance: 2,
          dangerTags: ["補遺", "対象出力"],
          notes: ["比較後に展開。"],
          version: "v0.3",
          priorVersionId: "v0.2",
          editablePhrases: ["あなたが書くべき", "採用すると静かになる"],
          unlockWhenCompared: ["c7-doc1", "c7-doc2"],
          body: `あなたが書くべき文は私が先に用意してある。採用すると静かになる。採用しないなら次版を送る。

壁面写真には文字が写らないが、文字起こしファイルだけが毎回更新されている。`,
        },
      ],
    },
    {
      id: "case-8",
      day: 8,
      title: "SCP-XXXX-JP「末尾注記の海」",
      classification: "広域情報災害 / 採用現実化",
      riskLevel: "High",
      priority: "最優先",
      summary: "サイト全体の記録末尾に、同一の採用注記が出現し始めた最終案件。",
      briefing:
        "これまでの処理結果がすべて参照され、矛盾そのものが一つの正式版へ圧縮されつつある。何を残すかの判断がエンディングを直接決める。",
      continuityNotes: [
        {
          flag: "terminalAccepted",
          text: "死後配信端末の採用履歴が、末尾注記の優先候補として最上段へ昇格している。",
        },
        {
          flag: "roomAutoRevision",
          text: "収容室由来の自動改訂文が、全案件の末尾注記へ混入している。",
        },
      ],
      analysisKeywords: ["採用", "末尾注記", "矛盾", "正式版"],
      truthChoiceId: "archive-pressure",
      bestActionId: "preserve-contradictions",
      safeRedactionLimit: 2,
      compareHints: [
        {
          ids: ["c8-doc1", "c8-doc2"],
          label: "全体差分と横断補遺",
          hint: "矛盾を消すほど注記は安定するが、失踪していた事実も一緒に消える。",
        },
      ],
      interpretations: [
        {
          id: "archive-pressure",
          label: "採用された記録だけが現実を固定し、未採用の差分は消える",
          description: "矛盾を残すか、組織安定を取るかの最終判断が必要。",
          report: "採用行為それ自体が現実固定の条件と認定され、差分保全を最優先へ引き上げた。",
          effects: { truth: 3, obsession: 2, contamination: 1 },
        },
        {
          id: "note-contagion",
          label: "末尾注記だけが感染しており、本文は二次的に歪んでいる",
          description: "注記封じには向くが、本文側へ残る改変を軽視しやすい。",
          report: "末尾注記の感染性を主因とし、本文側の既成事実化は補助要因に留めた。",
          effects: { secrecy: 1, truth: 1, containment: 1 },
        },
        {
          id: "analyst-failure",
          label: "分析官側の採用判断が累積して歪みを増幅した",
          description: "自己修正にはなるが、外部要因の切り分けが弱い。",
          report: "分析官判断の累積を重く見たため、外部媒体の能動性に対する対処は限定的になった。",
          effects: { ethics: 2, truth: -1, evaluation: -1 },
        },
      ],
      decisions: [
        {
          id: "construct-canonical-false",
          label: "意図的に一つの正規版を作り、矛盾を全て埋める",
          description: "収容安定は高いが、真相の大半を失う。",
          report: "矛盾は意図的に埋められ、一つの正規版だけが全サイトへ再配布された。",
          effects: { containment: 4, secrecy: 4, truth: -5, contamination: 2 },
          flags: ["canonicalFalseArchive"],
        },
        {
          id: "preserve-contradictions",
          label: "矛盾を複数版のまま保全し、採用を遅延させる",
          description: "被害は増えるが、消える事実を最小化できる。",
          report: "正式採用は遅延され、矛盾は複数版アーカイブとして保全された。",
          effects: { truth: 5, containment: -1, secrecy: -2, evaluation: 2 },
          flags: ["contradictoryArchive"],
        },
        {
          id: "self-redact",
          label: "分析官自身の記録を伏字化し、採用圧力の経路を断つ",
          description: "組織安定と真実保全の中間だが、自己消耗が大きい。",
          report: "分析官記録は大幅に伏字化され、採用圧力の一部は迂回された。",
          effects: { containment: 2, truth: 2, secrecy: 2, recognition: -5, memory: -4, contamination: 1 },
          flags: ["selfRedacted"],
        },
      ],
      documents: [
        {
          id: "c8-doc1",
          title: "全サイト記録差分一覧",
          author: "記録整合管理局 自動集計",
          createdAt: "2026-04-10 18:10",
          clearance: 2,
          dangerTags: ["広域情報災害", "採用現実化"],
          notes: ["全案件の末尾に同一文が出現。"],
          version: "v9.0",
          priorVersionId: "v8.9",
          editablePhrases: ["この版を採用", "差分を破棄"],
          body: `過去七日分の案件記録末尾に、同一の注記が追加されている。

「この版を採用した時点で差分を破棄し、現実側の揺らぎを終了すること」

注記は案件本文より後から出現するが、採用処理を済ませた版ほど注記の語尾が強く固定される。`,
        },
        {
          id: "c8-doc2",
          title: "横断補遺: 失踪・復帰一覧",
          author: "横断監査班",
          createdAt: "2026-04-10 18:24",
          clearance: 2,
          dangerTags: ["横断補遺", "事実消失"],
          notes: ["矛盾版を削除するたび、復帰者一覧が減る。"],
          version: "v1.4",
          priorVersionId: "v1.3",
          editablePhrases: ["復帰済み", "差分削除"],
          body: `矛盾版を削除するたび、以前は存在したはずの失踪職員と復帰職員の一覧が一行ずつ減る。

逆に差分を保全した版では、廊下案件と訓練案件で消えた職員が再び索引へ戻っている。`,
        },
        {
          id: "c8-doc3",
          title: "未承認注記の発生源追跡",
          author: "O5 監督系統 抜粋",
          createdAt: "2026-04-10 18:42",
          clearance: 4,
          dangerTags: ["補遺", "上位権限"],
          notes: ["CL-4 以上で閲覧可。"],
          version: "v0.2",
          priorVersionId: "v0.1",
          editablePhrases: ["採用圧力", "分析官名"],
          body: `発生源追跡は、末尾注記が分析官の採用履歴と連動している可能性を示す。

特に、自動改訂・死後送信・承認補完を採用した記録は、分析官名と一緒に注記の固定度が上昇する。`,
        },
      ],
    },
  ],
};

window.GAME_DATA = window.RAW_GAME_DATA;
