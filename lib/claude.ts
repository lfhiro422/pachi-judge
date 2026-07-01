import { JudgeRequest, JudgeResult, MachineRuleDetail } from "./types";

// ------------------------------------------------------------------
// TODO（次のマイルストーン）: Claude API（vision入力）による本判定の実装
//
// 実装方針:
//   1. 環境変数 ANTHROPIC_API_KEY を Vercel に設定する
//   2. `npm install @anthropic-ai/sdk` を追加
//   3. 撮影画像（base64 or URL）を受け取れるよう JudgeRequest を拡張する
//      （現状は数値入力のダミーUIだが、本番はカメラ/画像アップロードに差し替える）
//   4. 「判定ロジック文章」シートの内容をそのままシステムプロンプトに埋め込み、
//      機種ルール詳細（この機種IDに紐づく全行）を「正しいデータ」として
//      ユーザープロンプトに埋め込む。AIの記憶で補わないことを明示的に指示する。
//   5. 出力フォーマットは判定ロジック文章シート5章の形式
//      （判定 / 理由 / 参照したルール / 推定投資額 or 次の確認タイミング）で
//      JSONを強制し、そのままJudgeResultにパースする。
//
// 現時点では lib/judge-engine.ts のルールベース実装をそのまま呼び出す
// ダミー実装になっている。
// ------------------------------------------------------------------

export async function judgeWithClaudeVision(
  request: JudgeRequest,
  ruleDetails: MachineRuleDetail[]
): Promise<JudgeResult> {
  // TODO: ここで Anthropic API (vision) を呼び出す。ruleDetails はプロンプト埋め込み用。
  void ruleDetails;
  const { judge } = await import("./judge-engine");
  return judge(request);
}
