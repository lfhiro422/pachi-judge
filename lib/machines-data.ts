import { MachineMaster, MachineRuleDetail } from "./types";

// ------------------------------------------------------------------
// このファイルは「機種マスタ」「機種ルール詳細」シートの内容を
// そのままハードコードしたダミーデータです。
// 本番では lib/sheets.ts が Google Sheets API から同じ形に整形して返すため、
// UI・判定ロジック側はこのデータ構造だけを見ていれば動くようにしてあります。
// （= このファイルを丸ごと削除して sheets.ts に差し替えても他のコードは壊れない）
// 最終確認日: 2026-06-23
// ------------------------------------------------------------------

export const machineMasters: MachineMaster[] = [
  {
    machineId: "hokutonoken_2023",
    machineName: "スマスロ北斗の拳",
    maker: "サミー",
    releaseDate: "2023-04-03",
    machineType: "AT機",
    hasCeiling: true,
    hasZone: true,
    hasOwnPoint: false,
    baseQuitTiming:
      "BB終了後、内部状態（天国/本前兆の可能性）を確認のうえヤメ時を判断",
    lastConfirmedAt: "2026-06-23",
    sourceMemo: "1geki.jp / slogati.com / slobase.com / nana-press.com 等",
    notes: "天井が300G/777G/800Gで短縮抽選される独自仕様。北斗ブランドの王道機",
  },
  {
    machineId: "hokutonoken_tensei2",
    machineName: "スマスロ北斗の拳 転生の章2",
    maker: "サミー",
    releaseDate: "要確認",
    machineType: "AT機",
    hasCeiling: true,
    hasZone: true,
    hasOwnPoint: true,
    baseQuitTiming:
      "AT終了後即ヤメが基本。ただし残りカウンターが多い場合は継続判断",
    lastConfirmedAt: "2026-06-23",
    sourceMemo: "1geki.jp / slogati.com / slobase.com / nana-press.com 等",
    notes:
      "ゲーム数の代わりに独自カウンター「あべし」を使用する点に注意。①と同シリーズで比較しやすい",
  },
  {
    machineId: "bakemonogatari_2025",
    machineName: "スマスロ化物語",
    maker: "サミー",
    releaseDate: "2025-12-08",
    machineType: "AT機",
    hasCeiling: true,
    hasZone: true,
    hasOwnPoint: false,
    payoutSetting1: 97.4,
    payoutSetting6: 112.4,
    baseQuitTiming:
      "AT（俙時間）終了後、解呪連モードや高確状態を確認してヤメ時を判断",
    lastConfirmedAt: "2026-06-23",
    sourceMemo: "1geki.jp / slogati.com / slobase.com / nana-press.com 等",
    notes:
      "設置約12,000台/4,769店舗と導入実績が高い。ヤメ時の判断要素が多い複合型",
  },
  {
    machineId: "tokyoghoul_2025",
    machineName: "L東京喰種",
    maker: "スパイキー",
    releaseDate: "2025-02-03",
    machineType: "AT機",
    hasCeiling: true,
    hasZone: true,
    hasOwnPoint: false,
    baseQuitTiming:
      "AT（東京喰種咬）終了後、特化ゾーンや赫眼状態の有無を確認してヤメ時を判断",
    lastConfirmedAt: "2026-06-23",
    sourceMemo: "1geki.jp / slogati.com / slobase.com / nana-press.com 等",
    notes: "天井が2種類（CZ間/AT間）あるシンプル寄りの天井型。チェリー高確の赫眼状態が特徴",
  },
  {
    machineId: "enenshouboutai2_2026",
    machineName: "Lパチスロ炎炎ノ消防隊2",
    maker: "SANKYO",
    releaseDate: "2026-02-02",
    machineType: "AT機",
    hasCeiling: true,
    hasZone: true,
    hasOwnPoint: false,
    payoutSetting1: 97.7,
    payoutSetting6: 114.9,
    baseQuitTiming:
      "伝導者の罠終了後88G+前兆消化を確認してヤメ。炎炎ループ絡みは要注意",
    lastConfirmedAt: "2026-06-23",
    sourceMemo: "1geki.jp / slogati.com / slobase.com / nana-press.com 等",
    notes:
      "ボーナス間/炎炎ループ間の2段階天井+スルー天井を持つ複数ゾーン型の典型例",
  },
];

export const machineRuleDetails: MachineRuleDetail[] = [
  // --- スマスロ北斗の拳 ---
  {
    machineId: "hokutonoken_2023",
    category: "天井",
    itemName: "AT間天井",
    thresholdRaw: "1268G+α（前兆最大32G）",
    triggerCondition: "AT間ゲーム数消化",
    benefit: "バトルボーナス当選（継続率優遇+北斗揃い期待度アップ）",
    targetMemo: "等価550G〜、56枚持ち570G〜が目安",
    notes: "",
  },
  {
    machineId: "hokutonoken_2023",
    category: "天井",
    itemName: "天井短縮抽選",
    thresholdRaw: "300G/777G/800Gで抽選",
    triggerCondition: "規定ゲーム到達時に抽選",
    benefit: "777G短縮時は北斗揃い確定",
    targetMemo: "",
    notes: "前回AT終了時の抽選ではなく規定G到達時の都度抽選",
  },
  {
    machineId: "hokutonoken_2023",
    category: "リセット恩",
    itemName: "設定変更時天井短縮",
    thresholdRaw: "800G+αに短縮",
    triggerCondition: "設定変更",
    benefit: "天井が468G短縮される一方、北斗揃い優遇等の恩恵は変わらず",
    targetMemo: "",
    notes: "リセット濃厚なホールでは積極的に狙い目",
  },
  {
    machineId: "hokutonoken_2023",
    category: "やめ時",
    itemName: "BB終了後の内部状態確認",
    thresholdRaw: "-",
    triggerCondition: "BB終了時",
    benefit: "天国/本前兆濃厚なら続行価値あり",
    targetMemo: "",
    notes: "天国/本前兆の示唆が確認できない場合は即ヤメ厳禁の例外に当たらない",
  },

  // --- スマスロ北斗の拳 転生の章2 ---
  {
    machineId: "hokutonoken_tensei2",
    category: "天井",
    itemName: "AT間天井（あべし）",
    thresholdRaw: "目安1473あべし以内でAT当選",
    triggerCondition: "あべし数消化（滞在モードにより変動）",
    benefit: "1473あべし以降の当選はATレベル3以上の恩恵",
    targetMemo: "等価でも500あべし未満は天井狙い非推奨",
    notes: "ゲーム数ではなく独自カウンター「あべし」で判断する点に注意",
  },
  {
    machineId: "hokutonoken_tensei2",
    category: "ゾーン",
    itemName: "193〜256あべしゾーン",
    thresholdRaw: "193〜256あべし",
    triggerCondition: "あべし数消化",
    benefit: "当選期待度が高いゾーン（設定5-6は256あべし以内当選率約...）",
    targetMemo: "滞在モード不問で押さえておきたいゾーン",
    notes: "",
  },
  {
    machineId: "hokutonoken_tensei2",
    category: "リセット恩",
    itemName: "設定変更時天井短縮",
    thresholdRaw: "最大1280あべしに短縮",
    triggerCondition: "設定変更",
    benefit: "天井あべし数の短縮",
    targetMemo: "",
    notes: "",
  },
  {
    machineId: "hokutonoken_tensei2",
    category: "やめ時",
    itemName: "AT終了後の残りカウンター確認",
    thresholdRaw: "-",
    triggerCondition: "AT終了時",
    benefit: "残りあべし数が多い場合は継続価値あり",
    targetMemo: "",
    notes: "AT終了後即ヤメが基本の機種のため、例外条件は限定的",
  },

  // --- スマスロ化物語 ---
  {
    machineId: "bakemonogatari_2025",
    category: "天井",
    itemName: "AT間天井",
    thresholdRaw: "1000G+α（実質1003G）",
    triggerCondition: "（俙）夢の時間ヲ終わらセルな終了後のゲーム数消化",
    benefit: "AT（俙時間）+倍倍チャンスストックのゲーム数消化確定",
    targetMemo: "通常650G〜が狙い目の目安",
    notes: "",
  },
  {
    machineId: "bakemonogatari_2025",
    category: "ゾーン",
    itemName: "100G/200G/300Gのゾーン",
    thresholdRaw: "100G・200G・300G",
    triggerCondition: "規定ゲーム到達",
    benefit: "CZ「解呪ノ儀」当選チャンス（300G時は設定1でも約40%）",
    targetMemo: "300G付近が最も期待できるゾーン",
    notes: "",
  },
  {
    machineId: "bakemonogatari_2025",
    category: "リセット恩",
    itemName: "設定変更時天井短縮",
    thresholdRaw: "600Gに短縮",
    triggerCondition: "設定変更",
    benefit: "天井ゲーム数の短縮（通常の4割引）",
    targetMemo: "",
    notes: "朝イチの保険として有効、ただし積極的に狙うほどではない",
  },
  {
    machineId: "bakemonogatari_2025",
    category: "やめ時",
    itemName: "解呪連モード確認",
    thresholdRaw: "ショート（平均2連）/ミドル（平均4連）/ロング",
    triggerCondition: "AT終了後 or CZ失敗後の一部で移行",
    benefit: "解呪ノ儀の連続当選チャンスが継続",
    targetMemo: "",
    notes:
      "AT中800枚/1500枚以上獲得時は50G以内の引き戻しで枚数引継ぎのため即ヤメ厳禁",
  },

  // --- L東京喰種 ---
  {
    machineId: "tokyoghoul_2025",
    category: "天井",
    itemName: "CZ間天井",
    thresholdRaw: "600G+α",
    triggerCondition: "CZ間ゲーム数消化",
    benefit: "CZ（レミニセンス/大喰いの利佳）当選相当の権利",
    targetMemo: "等価250G〜、5.6枚交換300G〜",
    notes: "",
  },
  {
    machineId: "tokyoghoul_2025",
    category: "天井",
    itemName: "AT間天井",
    thresholdRaw: "1200G+α",
    triggerCondition: "AT間ゲーム数消化（実ゲーム数、スイカ加算G含まず）",
    benefit: "AT（東京喰種咬）当選",
    targetMemo: "等価240G付近（液晶320G目安）〜が目安",
    notes: "",
  },
  {
    machineId: "tokyoghoul_2025",
    category: "リセット恩",
    itemName: "設定変更時CZ間天井短縮",
    thresholdRaw: "200G+αに短縮",
    triggerCondition: "設定変更",
    benefit: "CZ間天井の大幅短縮",
    targetMemo: "",
    notes: "リセット確認できた台は0Gでも期待値プラスとされる",
  },
  {
    machineId: "tokyoghoul_2025",
    category: "独自pt",
    itemName: "赫眼状態",
    thresholdRaw: "10G/20G/30G/50Gのいずれかで継続",
    triggerCondition: "下段リプレイ成立で発動（状況問わず）",
    benefit: "滞在中レア役確率が約1/2.6まで上昇",
    targetMemo: "",
    notes: "特化ゾーンと絡むと出玉が大きく加速",
  },

  // --- Lパチスロ炎炎ノ消防隊2 ---
  {
    machineId: "enenshouboutai2_2026",
    category: "天井",
    itemName: "ボーナス間天井",
    thresholdRaw: "850G+α",
    triggerCondition: "ボーナスゲーム数消化",
    benefit: "ボーナス当選",
    targetMemo: "800G〜が目安",
    notes: "",
  },
  {
    machineId: "enenshouboutai2_2026",
    category: "天井",
    itemName: "炎炎ループ間天井",
    thresholdRaw: "2000G+α",
    triggerCondition: "炎炎ループ間ゲーム数消化",
    benefit: "炎炎ループ（炎炎激闘/炎炎大戦等）当選",
    targetMemo: "1900G〜が目安",
    notes: "",
  },
  {
    machineId: "enenshouboutai2_2026",
    category: "独自pt",
    itemName: "伝導者の罠スルー天井",
    thresholdRaw: "5連続スルー",
    triggerCondition: "伝導者の罠を5回連続でスルー",
    benefit: "6回目のSPエピソードBONUS確定",
    targetMemo: "",
    notes: "4スルー目の台は必ず打ち切る価値あり",
  },
  {
    machineId: "enenshouboutai2_2026",
    category: "ゾーン",
    itemName: "モードE（119モード）",
    thresholdRaw: "88G+前兆（計119G）",
    triggerCondition: "ボーナス当選ごとに通常モード抽選",
    benefit: "119Gまでのボーナス当選濃厚",
    targetMemo: "アイキャッチで119示唆が出れば滞在期待大",
    notes: "",
  },
  {
    machineId: "enenshouboutai2_2026",
    category: "リセット恩",
    itemName: "設定変更時天井短縮",
    thresholdRaw: "ボーナス間650G+α/炎炎ループ間短縮",
    triggerCondition: "設定変更",
    benefit: "両天井とも短縮",
    targetMemo: "",
    notes: "",
  },
  {
    machineId: "enenshouboutai2_2026",
    category: "やめ時",
    itemName: "伝導者の罠/炎炎激闘後の潜伏確認",
    thresholdRaw: "88G+前兆 or 28G潜伏",
    triggerCondition: "初当たり（レギュラーボーナス）後 or 炎炎激闘失敗後",
    benefit: "炎炎激闘の潜伏・復活の可能性",
    targetMemo: "",
    notes: "即ヤメ厳禁。必ずG数を確認してからヤメ",
  },
];

export function getMachineMaster(machineId: string): MachineMaster | undefined {
  return machineMasters.find((m) => m.machineId === machineId);
}

export function getRuleDetails(machineId: string): MachineRuleDetail[] {
  return machineRuleDetails.filter((r) => r.machineId === machineId);
}
