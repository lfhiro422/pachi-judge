import Anthropic from "@anthropic-ai/sdk";
import {
  JudgeRequest,
  JudgeResult,
  Judgement,
  MachineMaster,
  MachineRuleDetail,
  RawReadData,
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
//
// 2026-07-17 追記①:
//   実機写真での検証で、「総回転数」（設置後の通算回転数）と
//   「大当り後ゲーム数」（天井・ゾーン判定に使うべき数値）を取り違えたり、
//   「大当り後ゲーム数」が小さい値なのに通常時をAT中と誤判定する事例が確認された。
//   これを受けて、カウンターの種類を明確に区別させる指示と、
//   読み取った生データ（rawReadData）をJSON出力に独立項目として追加した。
//
// 2026-07-17 追記②:
//   ①の修正後、総回転数と大当り後ゲーム数の区別自体は改善されたが、
//   別の誤判定パターンが判明した。データカウンター上部に表示される
//   「AT +2.8枚/G 初期枚数150枚」のような機種スペック紹介パネル（静的な
//   説明情報）を、AIが「現在AT中である証拠」と誤解し、実際は通常時（大当り後
//   141G等）の台を「AT・CZ中」と誤判定していた。これを受けて、スペック紹介
//   パネルと実際の遊技状態表示を区別する指示を追加した。
// ------------------------------------------------------------------

const SYSTEM_PROMPT = `あなたはパチスロの台の状況を判定するアシスタントです。
以下のルールを厳密に守ってください。

1. 機種の天井・ゾーン・やめ時などの数値情報は、必ずユーザーメッセージ内の
   「機種ルールデータ」に書かれている内容だけを使ってください。
   あなたが一般知識として知っている当該機種の情報は絶対に使わないでください。
   ルールデータに書かれていない数値を推測で埋めないでください。

2. 添付された画像には、複数の異なるカウンターが表示されていることがあります。
   必ず種類を区別して読み取ってください。混同は絶対に避けてください。
   - 「総回転数」「総ゲーム数」（設置後や当日の通算回転数。これは天井カウントには使わない）
   - 「大当り後ゲーム数」「スタートからのゲーム数」「G数」（直近の当り・リセットからの
     経過ゲーム数。天井やゾーン狙いの判定は、原則としてこちらを使う）
   - 「前日」「2日前」等のラベルが付いた実績データ（過去の履歴であり、
     現在の状況判定には使わない）
   画像のどのラベルに対応する数値かを明確に読み取れない場合、無理に対応付けず
   「不明」としてください。

3. 現在の遊技状態（通常時／AT・CZ中など）の判断は特に慎重に行ってください。
   データカウンター上部などに表示される「AT」「AT +◯.◯枚/G」「初期枚数◯◯枚」
   「上乗せ○○」といった表示は、多くの機種で機種名やスペックを紹介する
   【静的な説明パネル】であり、現在まさにAT中であることを意味しません。
   このような表示だけを根拠に「AT・CZ中」と判定することは禁止します。
   「現在AT中かどうか」は、次のような、実際に遊技が進行中であることを示す
   直接的な証拠がある場合にのみ判定してください。
   - AT残りゲーム数・獲得枚数・上乗せ演出などがリアルタイムで進行中と分かる表示
   - 大当り後ゲーム数が0からカウントし直されておらず、かつ他の表示と合わせて
     AT消化中であることが明確な場合
   逆に、「大当り後ゲーム数」がある程度大きい値（例: 100G以上）で、かつ上記のような
   進行中の証拠が見当たらない場合は、通常時である可能性を優先して考えてください。
   確信が持てない場合は無理に「AT・CZ中」と判定せず、「不明」としてください。

4. 場面A（着席前判定）では GO / STAY / STOP のいずれか、
   場面B（やめ時判定）では STAY / STOP のいずれかを出力してください（場面BではGOは使いません）。

5. 出力は必ず次のJSON形式のみで返してください。前置きや説明文、Markdownのコードフェンスは一切不要です。
{
  "judgement": "GO" | "STAY" | "STOP",
  "reason": "初心者にもわかる平易な言葉で1文",
  "referencedRule": "ルールデータのどの項目を根拠にしたか（項目名を含める）",
  "rawReadData": {
    "totalSpinCount": "総回転数として読み取った値（不明ならnull）",
    "gamesSinceLastHit": "大当り後ゲーム数として読み取った値（不明ならnull）",
    "currentState": "通常時" | "AT・CZ中" | "不明",
    "notes": "読み取りに自信が持てなかった点があれば一言。無ければ空文字"
  },
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

function parseRawReadData(raw: unknown): RawReadData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const currentState =
    r.currentState === "通常時" || r.currentState === "AT・CZ中"
      ? r.currentState
      : "不明";
  return {
    totalSpinCount:
      typeof r.totalSpinCount === "string" ? r.totalSpinCount : null,
    gamesSinceLastHit:
      typeof r.gamesSinceLastHit === "string" ? r.gamesSinceLastHit : null,
    currentState,
    notes: typeof r.notes === "string" ? r.notes : "",
  };
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
    rawReadData?: unknown;
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
    rawReadData: parseRawReadData(parsed.rawReadData),
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
