import { getMachineMaster, getRuleDetails } from "./machines-data";
import {
  JudgeRequest,
  JudgeResult,
  MachineRuleDetail,
} from "./types";

// ------------------------------------------------------------------
// 【重要】これは "ダミー判定UI" 用のルールベース実装です。
// スプレッドシート「判定ロジック文章」シートの手順（場面A/B、GO/STAY/STOPの基準）を
// そのままコードにしたもので、Claude Vision API を使った本番判定に置き換える前提の
// 仮実装です。本番化する際は lib/claude.ts の judgeWithClaudeVision() に差し替え、
// このファイルは「AIの判定結果が明らかにおかしい時の保険（フォールバック）」として
// 残す運用を想定しています。
// ------------------------------------------------------------------

/** 文字列中の最初の整数を拾う。"等価550G〜、56枚持ち570G〜" → 550 */
function extractFirstNumber(text: string): number | null {
  const match = text.match(/\d+/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

/** 天井・ゾーンの行から「狙い目ライン」を1つ求める。狙い目メモ優先、無ければしきい値から。 */
function resolveTargetLine(rule: MachineRuleDetail): number | null {
  const fromMemo = extractFirstNumber(rule.targetMemo);
  if (fromMemo !== null) return fromMemo;
  return extractFirstNumber(rule.thresholdRaw);
}

function judgeSceneA(machineId: string, currentCount: number): JudgeResult {
  const rules = getRuleDetails(machineId).filter(
    (r) => r.category === "天井" || r.category === "ゾーン"
  );

  const candidates = rules
    .map((r) => ({ rule: r, targetLine: resolveTargetLine(r) }))
    .filter((c): c is { rule: MachineRuleDetail; targetLine: number } => c.targetLine !== null);

  if (candidates.length === 0) {
    return {
      judgement: "STAY",
      reason:
        "この機種の天井・ゾーンの狙い目ラインがルール詳細に見つかりませんでした。数値が確認できるまでは保守的に様子見にします。",
      referencedRule: "該当ルールなし",
      estimatedInvestment: "不明",
    };
  }

  // 「現在地から最も近いものを優先」（判定ロジック文章 3章より）
  candidates.sort(
    (a, b) =>
      Math.abs(a.targetLine - currentCount) - Math.abs(b.targetLine - currentCount)
  );
  const nearest = candidates[0];
  const { rule, targetLine } = nearest;

  let judgement: JudgeResult["judgement"];
  let reason: string;

  if (currentCount >= targetLine) {
    judgement = "GO";
    reason = `${rule.itemName}の狙い目ライン（目安${targetLine}）をすでに超えています。狙い目圏内です。`;
  } else if (currentCount >= targetLine * 0.7) {
    judgement = "STAY";
    reason = `${rule.itemName}の狙い目ライン（目安${targetLine}）までもう少しです。近づくまで様子見が無難です。`;
  } else {
    judgement = "STOP";
    reason = `${rule.itemName}の狙い目ライン（目安${targetLine}）まで距離があります。今の状況では見送りが無難です。`;
  }

  return {
    judgement,
    reason,
    referencedRule: `${rule.category}｜${rule.itemName}（狙い目メモ: ${rule.targetMemo || rule.thresholdRaw}）`,
    estimatedInvestment: "不明（コイン単価データ未登録のため保守的判断）",
  };
}

function judgeSceneB(
  machineId: string,
  exceptionConditionMet: boolean | null
): JudgeResult {
  const quitRules = getRuleDetails(machineId).filter((r) => r.category === "やめ時");
  const rule = quitRules[0];
  const master = getMachineMaster(machineId);

  const referencedRule = rule
    ? `やめ時｜${rule.itemName}（備考: ${rule.notes || "-"}）`
    : master
    ? `機種マスタの基本のやめ時: ${master.baseQuitTiming}`
    : "該当ルールなし";

  if (exceptionConditionMet === true) {
    return {
      judgement: "STAY",
      reason: "即ヤメ厳禁の例外条件に当てはまっています。もう少し様子を見てください。",
      referencedRule,
      nextCheckTiming: "内部状態に動きがあるまで数ゲーム様子見",
    };
  }

  if (exceptionConditionMet === false) {
    return {
      judgement: "STOP",
      reason: "即ヤメ厳禁の例外条件には当てはまらず、有利な引き継ぎ要素も確認できません。ここでやめるのが無難です。",
      referencedRule,
    };
  }

  // null = 画像だけでは判断しきれない
  return {
    judgement: "STAY",
    reason:
      "例外条件に当てはまるか画像だけでは判断できませんでした。保守的にもう少し様子見とし、確認できる情報があれば教えてください。",
    referencedRule,
    nextCheckTiming: "内部状態の示唆が画面に出るまで様子見",
  };
}

export function judge(request: JudgeRequest): JudgeResult {
  if (request.scene === "A") {
    return judgeSceneA(request.machineId, request.currentCount);
  }
  return judgeSceneB(request.machineId, request.exceptionConditionMet);
}
