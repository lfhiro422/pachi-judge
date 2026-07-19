/**
 * lib/machine-schema.ts
 *
 * 「機種マスタ」「機種ルール詳細」シートの列構成に対応する型定義。
 * 列の並び順を変更した場合は、ここと sheets.ts の appendRows 呼び出し側も
 * 合わせて修正すること。
 */

import { z } from "zod";

// ── 機種マスタ（1機種=1行） ──────────────────────
// 機種ID, 機種名, メーカー, 導入日, 機種タイプ, 天井概念_あり, ゾーン概念_あり,
// 独自ポイント制_あり, 機械割_設定1, 機械割_設定6, 基本のやめ時, 最終確認日,
// 出典メモ(事実のみ), 備考
export const MachineMasterSchema = z.object({
  machineId: z
    .string()
    .regex(/^[a-z0-9_]+$/, "機種IDは英数字とアンダースコアのみ（例: hokutonoken_2023）"),
  machineName: z.string().min(1),
  maker: z.string().min(1),
  releaseDate: z.string().nullable(), // "2026/1/5" or null（不明な場合）
  machineType: z.string().min(1), // 現状MVPでは "AT機" 固定運用
  hasCeiling: z.enum(["あり", "なし"]),
  hasZone: z.enum(["あり", "なし"]),
  hasCustomPoint: z.enum(["あり", "なし"]),
  payoutSetting1: z.number().nullable(), // 0.976 のような小数。不明ならnull
  payoutSetting6: z.number().nullable(),
  basicQuitTiming: z.string().nullable(), // やめ時の一言サマリ。不明ならnull
  lastVerifiedDate: z.string(), // 今日の日付を機械的に入れる
  sourceMemo: z.string().nullable(), // 出典サイト名の列挙（事実のみ、文章コピペ禁止）。不明ならnull
  notes: z.string().nullable(),
});
export type MachineMaster = z.infer<typeof MachineMasterSchema>;

// ── 機種ルール詳細（1機種=複数行） ──────────────────
// 機種ID, 機種名(参照用), カテゴリ, 項目名, 数値・しきい値, 発動条件,
// 恩恵・効果, 狙い目メモ, 備考
export const MachineRuleSchema = z.object({
  machineId: z.string(),
  machineName: z.string(),
  category: z.enum(["天井", "ゾーン", "独自pt", "リセット恩恵", "やめ時"]),
  itemName: z.string().min(1),
  thresholdValue: z.string().nullable(), // 数値レンジは文字列表現のまま保持（例: "1268G+α"）。
  // 「やめ時」など数値のしきい値概念がない項目ではAIがnullを返すことがあるため許容する。
  triggerCondition: z.string().min(1),
  benefit: z.string().min(1),
  targetMemo: z.string().nullable(),
  notes: z.string().nullable(),
});
export type MachineRule = z.infer<typeof MachineRuleSchema>;

export const ExtractedMachineSchema = z.object({
  master: MachineMasterSchema,
  rules: z.array(MachineRuleSchema).min(0),
  // AIが自信を持てなかった項目のリスト（人の確認を促すため）
  uncertainFields: z.array(z.string()).default([]),
});
export type ExtractedMachine = z.infer<typeof ExtractedMachineSchema>;

/** MachineMaster を機種マスタシートの1行（配列）に変換 */
export function masterToRow(m: MachineMaster): (string | number)[] {
  return [
    m.machineId,
    m.machineName,
    m.maker,
    m.releaseDate ?? "(要確認)",
    m.machineType,
    m.hasCeiling,
    m.hasZone,
    m.hasCustomPoint,
    m.payoutSetting1 ?? "",
    m.payoutSetting6 ?? "",
    m.basicQuitTiming ?? "(要確認)",
    m.lastVerifiedDate,
    m.sourceMemo ?? "(要確認)",
    m.notes ?? "",
  ];
}

/** MachineRule を機種ルール詳細シートの1行（配列）に変換 */
export function ruleToRow(r: MachineRule): (string | number)[] {
  return [
    r.machineId,
    r.machineName,
    r.category,
    r.itemName,
    r.thresholdValue ?? "(該当なし)",
    r.triggerCondition,
    r.benefit,
    r.targetMemo ?? "",
    r.notes ?? "",
  ];
}