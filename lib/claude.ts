import Anthropic from "@anthropic-ai/sdk";
import {
  JudgeRequest,
  JudgeResult,
  Judgement,
  MachineMaster,
  MachineRuleDetail,
} from "./types";

// ------------------------------------------------------------------
// Claude Vision API による本判定
//
// 設計方針（重要）:
//   機種のルールデータ（天井G数・ゾーン・狙い目など）は必ずスプレッドシート
//   由来のデータ（machineRuleDetails）だけを使う。Claudeの「一般知識」で
//   補うことは指示レベルで明示的に禁止している。
//   Claudeに担わせるのは次の2つだけ:
//     ① 写真から現在のゲーム数・内部状態の示唆を読み取る
//     ② 与えられたルールデータと読み取った状況を突き合わせて GO/STAY/STOP を判定する
// ------------------------------------------------------------------

const SYSTEM_PROMPT = `あなたはパチスロの台の状況を判定するアシスタントです。
以下のルールを厳密に守ってください。

1. 機種の天井・ゾーン・やめ時などの数値情報は、必ずユーザーメッセージ内の
   「機種ルールデータ」に書かれている内容だけを使ってください。
   あなたが一般知識として知っている当該機種の情報は絶対に使わないでください。
   ルールデータに書かれていない数値を推測で埋めないでください。
2. 添付された画像から、以下を読み取ってください。
   - 現在のゲーム数、または機種固有のカウンター（「あべし」等、ルールデータに
     単位が明記されている場合はその単位に従う）
   - 天国示唆・モード示唆など、画面や台に表示されている内部状態の手がかり
   画像から読み取れない場合は、無理に数値を作らず「不明」として保守的に判定してください。
3. 場面A（着席前判定）では GO / STAY / STOP のいずれか、
   場面B（やめ時判定）では STAY / STOP のいずれかを出力してください（場面BではGOは使いません）。
4. 出力は必ず次のJSON形式のみで返してください。前置きや説明文、Markdownのコードフェンスは一切不要です。
{
  "judgement": "GO" | "STAY" | "STOP",
  "reason": "初心者にもわかる平易な言葉で1文",
  "referencedRule": "ルールデータのどの項目を根拠にしたか（項目名を含める）",
  "estimatedInvestment": "場面Aのみ。不明な場合は「不明」と明記",
  "nextCheckTiming": "場面Bのみ。STAYの場合、次に何を確認すべきか"
}`;

function buildUserPrompt(
  request: JudgeRequest,
  master: MachineMaster | undefined,
  ruleDetails: MachineRuleDetail[]
): string {
  const ruleDataText = ruleDetails
    .map(
      (r, i) =>
        `${i + 1}. [${r.category}] ${r.itemName} / しきい値: ${r.thresholdRaw} / 発動条件: ${r.triggerCondition} / 恩恵: ${r.benefit} / 狙い目メモ: ${r.targetMemo || "-"} / 備考: ${r.notes || "-"}`
    )
    .join("\n");

  const sceneText =
    request.scene === "A"
      ? `場面A（着席前判定）です。ユーザーが手入力した参考値: 現在のカウンター=${request.currentCount}, リセット濃厚=${request.resetLikely ? "はい" : "いいえ"}。
画像が読み取れる場合は画像の情報を優先し、読み取れない場合のみこの手入力値を参考にしてください。`
      : `場面B（やめ時判定）です。ユーザーが手入力した参考値: 即ヤメ厳禁の例外条件に該当するか=${
          request.exceptionConditionMet === true
            ? "該当する"
            : request.exceptionConditionMet === false
            ? "該当しない"
            : "不明"
        }。
画像が読み取れる場合は画像の情報を優先し、読み取れない場合のみこの手入力値を参考にしてください。`;

  return `機種名: ${master?.machineName ?? "不明"}（機種ID: ${request.machineId}）
機種の基本のやめ時: ${master?.baseQuitTiming ?? "-"}

機種ルールデータ（このデータだけを根拠にしてください）:
${ruleDataText || "（この機種のルールデータはありません）"}

${sceneText}

添付した画像を見て、判定結果をJSON形式のみで返してください。`;
}

function parseJudgeResponse(
  text: string,
  scene: "A" | "B"
): JudgeResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    judgement: string;
    reason: string;
    referencedRule: string;
    estimatedInvestment?: string;
    nextCheckTiming?: string;
  };

  const validJudgements: Judgement[] =
    scene === "A" ? ["GO", "STAY", "STOP"] : ["STAY", "STOP"];
  const judgement = validJudgements.includes(parsed.judgement as Judgement)
    ? (parsed.judgement as Judgement)
    : "STAY"; // 想定外の値が来た場合は保守的にSTAYへフォールバック

  return {
    judgement,
    reason: parsed.reason || "判定理由を取得できませんでした。",
    referencedRule: parsed.referencedRule || "-",
    estimatedInvestment: scene === "A" ? parsed.estimatedInvestment : undefined,
    nextCheckTiming: scene === "B" ? parsed.nextCheckTiming : undefined,
    usedVision: true,
  };
}

// ------------------------------------------------------------------
// 機種名の自動認識
//
// データカウンター上部のパネルや台のパネル部分に表示されている機種名を読み取り、
// 機種マスタ（スプレッドシート由来のリスト）の中から一致するものを選ばせる。
// 一般知識で機種を推測させるのではなく、あくまで「画像中の文字列」と
// 「与えられたリストの機種名」の照合に限定することで、
// リストにない機種を誤って存在するかのように答えることを防ぐ。
// ------------------------------------------------------------------

const IDENTIFY_SYSTEM_PROMPT = `あなたはパチスロ台の写真から機種名を読み取るアシスタントです。
以下のルールを厳密に守ってください。

1. 画像内の、データカウンター上部パネルの機種名表示、または台上部・腰部のパネル装飾に
   書かれている文字列から機種名を読み取ってください。
2. 読み取った機種名を、ユーザーメッセージ内の「登録済み機種リスト」と照合してください。
   リストに無い機種だと判断した場合や、画像から機種名を確信を持って読み取れない場合は、
   絶対に無理にリストの中から選ばないでください。
3. リストに存在しない機種名を、あなたの一般知識で補って回答することは絶対にしないでください。
   このシステムの目的は「画像の文字とリストの突き合わせ」だけです。
4. 出力は必ず次のJSON形式のみで返してください。前置き・説明文・Markdownのコードフェンスは不要です。
{
  "matchedMachineId": "登録済み機種リストのIDのいずれか。確信が持てない場合はnull",
  "detectedText": "画像から読み取れた機種名らしき文字列（読み取れない場合は空文字）",
  "confidence": "high" | "low"
}`;

export interface IdentifyMachineResult {
  matchedMachineId: string | null;
  detectedText: string;
  confidence: "high" | "low";
}

export async function identifyMachineFromImage(
  imageBase64: string,
  imageMediaType: string,
  candidates: MachineMaster[]
): Promise<IdentifyMachineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const anthropic = new Anthropic({ apiKey });

  const listText = candidates
    .map((m) => `- ID: ${m.machineId} / 機種名: ${m.machineName}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: IDENTIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `登録済み機種リスト:\n${listText}\n\n画像を見て、機種名を判定しJSON形式のみで返してください。`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { matchedMachineId: null, detectedText: "", confidence: "low" };
  }

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      matchedMachineId: string | null;
      detectedText?: string;
      confidence?: string;
    };
    const matchedId =
      parsed.matchedMachineId &&
      candidates.some((c) => c.machineId === parsed.matchedMachineId)
        ? parsed.matchedMachineId
        : null;
    return {
      matchedMachineId: matchedId,
      detectedText: parsed.detectedText ?? "",
      confidence: parsed.confidence === "high" ? "high" : "low",
    };
  } catch {
    return { matchedMachineId: null, detectedText: "", confidence: "low" };
  }
}

export async function judgeWithClaudeVision(
  request: JudgeRequest,
  ruleDetails: MachineRuleDetail[],
  master: MachineMaster | undefined
): Promise<JudgeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!request.imageBase64 || !request.imageMediaType) {
    throw new Error("image is required for vision judgement");
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: request.imageMediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: request.imageBase64,
            },
          },
          {
            type: "text",
            text: buildUserPrompt(request, master, ruleDetails),
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return parseJudgeResponse(textBlock.text, request.scene);
}
