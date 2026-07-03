/**
 * app/api/admin/commit-machine/route.ts
 *
 * 入力: ExtractedMachine（人が画面上で確認・修正した後の最終データ）
 * 処理: 機種マスタに1行、機種ルール詳細にN行を追記する。
 *
 * 重複登録防止のため、機種IDが既に存在する場合はエラーを返す
 * （上書き更新をしたい場合は別途「更新」用のエンドポイントを作る想定。
 *  MVPでは追記のみに絞ってシンプルにしている）。
 */

import { NextRequest, NextResponse } from "next/server";
import { ExtractedMachineSchema, masterToRow, ruleToRow } from "@/lib/machine-schema";
import { appendRows, machineIdExists } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ExtractedMachineSchema.parse(body);

    const alreadyExists = await machineIdExists(data.master.machineId);
    if (alreadyExists) {
      return NextResponse.json(
        {
          error: `機種ID "${data.master.machineId}" は既に機種マスタに存在します。IDを変えるか、既存行を手動で更新してください。`,
        },
        { status: 409 }
      );
    }

    // 機種マスタへ1行追記
    await appendRows("機種マスタ", [masterToRow(data.master)]);

    // 機種ルール詳細へN行追記（ルールが0件の機種＝ジャグラー系等もOK）
    if (data.rules.length > 0) {
      await appendRows(
        "機種ルール詳細",
        data.rules.map((r) => ruleToRow(r))
      );
    }

    return NextResponse.json({
      success: true,
      machineId: data.master.machineId,
      rulesAdded: data.rules.length,
    });
  } catch (err) {
    console.error("commit-machine error:", err);
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json({ error: `書き込みに失敗しました: ${message}` }, { status: 500 });
  }
}
