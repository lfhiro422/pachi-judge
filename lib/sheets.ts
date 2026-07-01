import { MachineMaster, MachineRuleDetail } from "./types";
import { machineMasters, machineRuleDetails } from "./machines-data";

// ------------------------------------------------------------------
// TODO（次のマイルストーン）: Google Sheets API 連携の本実装
//
// 対象スプレッドシート:
//   https://docs.google.com/spreadsheets/d/1Dxi3RWtjePPUGTpdKI5e_ORFLh2FMllFxkzVp0FJAnA/edit
//   タブ「機種マスタ」「機種ルール詳細」を読む。
//
// 実装方針:
//   1. Google Cloud でサービスアカウントを作成し、対象シートを「閲覧者」として共有する
//   2. 環境変数に以下を設定（Vercelの場合はプロジェクト設定 > Environment Variables）
//        GOOGLE_SERVICE_ACCOUNT_EMAIL
//        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   ( \n は文字列のまま保存し、コード側で置換する )
//        GOOGLE_SHEETS_SPREADSHEET_ID
//   3. `npm install googleapis` を追加
//   4. 下記関数の中身を、Sheets API `spreadsheets.values.get` に置き換える
//      （行→MachineMaster / MachineRuleDetail への変換だけ行えばよく、
//        呼び出し側 [app/api/machines, lib/judge-engine.ts] は変更不要）
//
// 現時点ではダミーデータ（lib/machines-data.ts = スプレッドシートの内容を転記したもの）を
// そのまま返すことで、UI・API・判定ロジックを先に完成させられるようにしている。
// ------------------------------------------------------------------

export async function fetchMachineMasters(): Promise<MachineMaster[]> {
  // TODO: Sheets API の "機種マスタ" タブを取得して MachineMaster[] に変換する
  return machineMasters;
}

export async function fetchMachineRuleDetails(): Promise<MachineRuleDetail[]> {
  // TODO: Sheets API の "機種ルール詳細" タブを取得して MachineRuleDetail[] に変換する
  return machineRuleDetails;
}
