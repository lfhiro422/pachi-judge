// pachi-judge の中核データ型
// スプレッドシート「機種マスタ」「機種ルール詳細」の列構成にそのまま対応させている。
// 将来 lib/sheets.ts が Google Sheets API から読み込む値も、この型に整形して返す。

export type MachineType = "AT機"; // MVPではAT機のみ対応（README_使い方の方針）

export interface MachineMaster {
  machineId: string;
  machineName: string;
  maker: string;
  releaseDate: string; // "要確認" のような文字列もそのまま許容
  machineType: MachineType;
  hasCeiling: boolean; // 天井概念_あり
  hasZone: boolean; // ゾーン概念_あり
  hasOwnPoint: boolean; // 独自ポイント制_あり
  payoutSetting1?: number; // 機械割_設定1（%）
  payoutSetting6?: number; // 機械割_設定6（%）
  baseQuitTiming: string; // 基本のやめ時
  lastConfirmedAt: string; // 最終確認日
  sourceMemo: string; // 出典メモ(事実のみ)
  notes: string; // 備考
}

export type RuleCategory = "天井" | "ゾーン" | "独自pt" | "リセット恩" | "やめ時";

export interface MachineRuleDetail {
  machineId: string;
  category: RuleCategory;
  itemName: string; // 項目名
  thresholdRaw: string; // 数値・しきい値（自由記述）
  triggerCondition: string; // 発動条件
  benefit: string; // 恩恵・効果
  targetMemo: string; // 狙い目メモ
  notes: string; // 備考
}

export type Scene = "A" | "B"; // A: 着席前判定 / B: やめ時判定

export type Judgement = "GO" | "STAY" | "STOP";

export interface JudgeRequestSceneA {
  scene: "A";
  machineId: string;
  currentCount: number; // 現在のゲーム数 or 機種固有カウンター（あべし等）
  resetLikely: boolean; // リセット恩恵を狙えるか（据え置き濃厚ホールでない等）
}

export interface JudgeRequestSceneB {
  scene: "B";
  machineId: string;
  exceptionConditionMet: boolean | null; // 即ヤメ厳禁の例外条件に該当するか。null=画像だけでは判断不可
}

export type JudgeRequest = JudgeRequestSceneA | JudgeRequestSceneB;

export interface JudgeResult {
  judgement: Judgement;
  reason: string; // 理由（1文、初心者向けの平易な言葉で）
  referencedRule: string; // 参照したルール（機種ルール詳細のどの行を根拠にしたか）
  estimatedInvestment?: string; // 推定投資額（場面Aのみ）
  nextCheckTiming?: string; // 次の確認タイミング（場面Bのみ）
}
