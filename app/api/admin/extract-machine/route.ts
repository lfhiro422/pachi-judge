/**
 * app/api/admin/extract-machine/route.ts
 *
 * 入力: { rawText: string, sourceUrls?: string[] }
 *   rawText には、複数の攻略サイトから集めた「事実」の断片を貼り付ける想定。
 *   （著作権上、記事の文章をそのまま貼るのではなく、数値・条件など事実部分を
 *    箇条書きでまとめたものを渡すのが望ましい。README記載の運用ルールと同じ）
 *
 * 出力: ExtractedMachine（機種マスタ1件 + 機種ルール詳細N件の下書き）
 *
 * このルートはシートに書き込まない。あくまで「下書き」を返すだけで、
 * 人が確認・修正してから /api/admin/commit-machine を呼ぶ2段階構成。
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractedMachineSchema } from "@/lib/machine-schema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはパチスロ機種の攻略データを構造化するアシスタントです。

## 厳守事項
- 入力に含まれる「事実（数値・条件・恩恵の内容）」だけを抽出する。
- 攻略サイトの文章表現をそのままコピーせず、簡潔な日本語で言い換える。
- 入力に書かれていない数値を推測・補完してはいけない。不明な項目は null にする。
  ただし rules[].thresholdValue だけは例外とし、null ではなく必ず文字列を入れること
  （数値が存在しない項目は「特になし」「-」など短い文字列で表現する）。
- 設定差（設定1〜6の詳細な挙動差）は判定ロジックに使わないMVP方針のため、
  機械割の設定1・設定6の数値以外の設定差情報は抽出しなくてよい。
- 迷った項目・情報源が1つしかなく裏取りできていない項目は、
  uncertainFields にその項目名を入れて、人に確認を促すこと。

## 出力形式
以下のJSON Schemaに厳密に従い、JSONのみを出力すること（説明文・前置き・Markdownのコードブロック記法は一切不要）。

{
  "master": {
    "machineId": "英数字とアンダースコアのみの一意なID（例: hokutonoken_2023）",
    "machineName": "正式名称",
    "maker": "メーカー名",
    "releaseDate": "YYYY/M/D 形式の文字列。不明ならnull",
    "machineType": "AT機 固定（MVP方針）",
    "hasCeiling": "あり" | "なし",
    "hasZone": "あり" | "なし",
    "hasCustomPoint": "あり" | "なし",
    "payoutSetting1": 0.976 のような小数、不明ならnull,
    "payoutSetting6": 0.976 のような小数、不明ならnull,
    "basicQuitTiming": "やめ時の一言サマリ。入力に手がかりがなければnull",
    "lastVerifiedDate": "YYYY-MM-DD 形式（今日の日付）",
    "sourceMemo": "参照したサイト名の列挙（例: 1geki.jp / slogati.com）。入力に手がかりがなければnull",
    "notes": "機種特有の注意点。なければnull"
  },
  "rules": [
    {
      "machineId": "masterと同じID",
      "machineName": "masterと同じ機種名",
      "category": "天井" | "ゾーン" | "独自pt" | "リセット恩恵" | "やめ時",
      "itemName": "項目名（例: AT間天井）",
      "thresholdValue": "数値・しきい値の文字列表現。「やめ時」など数値のしきい値概念がない項目でも、必ず何らかの文字列を入れること（例:「0G付近」「特になし」「-」）。nullにしてはいけない",
      "triggerCondition": "発動条件",
      "benefit": "恩恵・効果",
      "targetMemo": "狙い目メモ。なければnull",
      "notes": "備考。なければnull"
    }
  ],
  "uncertainFields": ["確認を推奨する項目名の配列"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: "rawText が短すぎます。攻略データをもう少し詳しく貼り付けてください。" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `今日の日付: ${today}\n\n以下の攻略データ断片から、機種マスタ1件・機種ルール詳細N件を抽出してください。\n\n---\n${rawText}\n---`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude APIからテキスト応答が得られませんでした。");
    }

    // Claudeがコードブロックで返してきた場合の保険
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsedJson = JSON.parse(cleaned);

    const validated = ExtractedMachineSchema.parse(parsedJson);

    return NextResponse.json({ draft: validated });
  } catch (err) {
    console.error("extract-machine error:", err);
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json(
      { error: `抽出に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}