import { NextRequest, NextResponse } from "next/server";
import { JudgeRequest } from "@/lib/types";
import { judge } from "@/lib/judge-engine";
import { getRuleDetails } from "@/lib/machines-data";

// 本番実装時: request.headers 等から画像を受け取り、
// judgeWithClaudeVision(request, ruleDetails) に差し替える想定。
// 現状は "ダミー判定UI" としてルールベースの judge() を直接使う。

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

  const ruleDetails = getRuleDetails(body.machineId);
  if (ruleDetails.length === 0) {
    return NextResponse.json(
      { error: "この機種のルール詳細がスプレッドシートに見つかりません" },
      { status: 404 }
    );
  }

  const result = judge(body);
  return NextResponse.json(result);
}
