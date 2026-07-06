/**
 * app/api/admin/bulk-import-machines/route.ts
 *
 * lib/machines-data.ts に直接コードとして追加されてきた機種データ
 * （本来のフローである /admin/add-machine を経由せず追加されたもの）を、
 * 一括でGoogleスプレッドシート本体（機種マスタ・機種ルール詳細）に書き込むための
 * 一度きりの移行用エンドポイント。
 *
 * /api/admin/ 配下なので middleware.ts のBasic認証で保護される。
 *
 * 使い方: 管理者認証をした状態でこのURLにGETアクセスするだけ。
 *   例: https://<ユーザー>:<パスワード>@pachi-judge.vercel.app/api/admin/bulk-import-machines
 *   （ブラウザで /admin/add-machine 等に一度ログインしていれば、
 *    同じブラウザでこのURLを直接開くだけでも認証情報が使われる）
 *
 * 冪等性: 既にスプレッドシートに存在する機種IDはスキップするため、
 * 複数回実行しても重複登録されない。
 */

import { NextResponse } from "next/server";
import { machineMasters, machineRuleDetails } from "@/lib/machines-data";
import { appendRows, machineIdExists } from "@/lib/sheets";

export async function GET() {
  try {
    const added: string[] = [];
    const skipped: string[] = [];

    const masterRows: (string | number)[][] = [];
    const ruleRows: (string | number)[][] = [];

    for (const m of machineMasters) {
      const exists = await machineIdExists(m.machineId);
      if (exists) {
        skipped.push(m.machineId);
        continue;
      }
      added.push(m.machineId);

      masterRows.push([
        m.machineId,
        m.machineName,
        m.maker,
        m.releaseDate ?? "(要確認)",
        m.machineType,
        m.hasCeiling ? "あり" : "なし",
        m.hasZone ? "あり" : "なし",
        m.hasOwnPoint ? "あり" : "なし",
        m.payoutSetting1 ?? "",
        m.payoutSetting6 ?? "",
        m.baseQuitTiming ?? "(要確認)",
        m.lastConfirmedAt,
        m.sourceMemo ?? "(要確認)",
        m.notes ?? "",
      ]);

      const rules = machineRuleDetails.filter((r) => r.machineId === m.machineId);
      for (const r of rules) {
        ruleRows.push([
          r.machineId,
          m.machineName, // 機種名(参照用)
          r.category,
          r.itemName,
          r.thresholdRaw,
          r.triggerCondition,
          r.benefit,
          r.targetMemo ?? "",
          r.notes ?? "",
        ]);
      }
    }

    if (masterRows.length > 0) {
      await appendRows("機種マスタ", masterRows);
    }
    if (ruleRows.length > 0) {
      await appendRows("機種ルール詳細", ruleRows);
    }

    return NextResponse.json({
      success: true,
      addedCount: added.length,
      added,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (err) {
    console.error("bulk-import-machines error:", err);
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json(
      { error: `一括インポートに失敗しました: ${message}` },
      { status: 500 }
    );
  }
}