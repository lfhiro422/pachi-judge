import { NextRequest, NextResponse } from "next/server";
import { JudgeRequest, JudgeResult } from "@/lib/types";
import { judge } from "@/lib/judge-engine";
import { judgeWithClaudeVision } from "@/lib/claude";
import {
  appendJudgeHistory,
  fetchMachineMasters,
  fetchMachineRuleDetails,
} from "@/lib/sheets";
import { MachineMaster } from "@/lib/types";

// 判定履歴の記録を試みる。失敗しても判定結果の返却自体は妨げない
// （スプレッドシート書き込みの失敗が、肝心の判定機能を止めてしまわないための安全弁）。
async function recordHistorySafely(
  body: JudgeRequest,
  result: JudgeResult,
  master: MachineMaster | undefined
) {
  try {
    await appendJudgeHistory(body, result, master);
  } catch (err) {
    console.error("appendJudgeHistory failed (judge result is unaffected):", err);
  }
}

export async function POST(req: NextRequest) {
  let body: JudgeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  if (!body.machineId) {
    return NextResponse.json({ error: "machineId は必須です" }, { status: 400 });
  }

  // 【修正】以前はコード内ハードコードのlib/machines-data.tsを参照していたため、
  // /admin/add-machineでスプレッドシートに追加した新機種が判定に反映されない
  // 不具合があった。fetchMachineRuleDetails/fetchMachineMastersでスプレッドシート
  // を都度取得するように変更（取得失敗時はsheets.ts内部でmachines-data.tsに自動フォールバック）。
  const allRuleDetails = await fetchMachineRuleDetails();
  const ruleDetails = allRuleDetails.filter((r) => r.machineId === body.machineId);
  if (ruleDetails.length === 0) {
    return NextResponse.json(
      { error: "この機種のルール詳細がスプレッドシートに見つかりません" },
      { status: 404 }
    );
  }

  const allMachineMasters = await fetchMachineMasters();
  const master = allMachineMasters.find((m) => m.machineId === body.machineId);

  // ANTHROPIC_API_KEY が設定されていて、かつ画像が送られてきた場合は
  // Claude Vision APIによる本判定を試みる。失敗した場合は手入力ベースの
  // ルールエンジンにフォールバックする（本番運用時の安全弁）。
  if (process.env.ANTHROPIC_API_KEY && body.imageBase64) {
    try {
      const result = await judgeWithClaudeVision(body, ruleDetails, master);
      await recordHistorySafely(body, result, master);
      return NextResponse.json(result);
    } catch (err) {
      console.error("Claude Vision judge failed, falling back to rule engine:", err);
    }
  }

  const result = judge(body);
  const resultWithVisionFlag: JudgeResult = { ...result, usedVision: false };
  await recordHistorySafely(body, resultWithVisionFlag, master);
  return NextResponse.json(resultWithVisionFlag);
}
