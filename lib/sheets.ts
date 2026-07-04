/**
 * lib/sheets.ts
 * Google Sheets API を使った読み書き処理
 */
import { google } from "googleapis";
import { MachineMaster, MachineRuleDetail } from "./types";
import { machineMasters, machineRuleDetails } from "./machines-data";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * 指定シートの末尾に行を追記する
 * @param sheetName "機種マスタ" | "機種ルール詳細"
 * @param rows 1行 = 1配列。複数行まとめて渡せる
 */
export async function appendRows(
  sheetName: string,
  rows: (string | number)[][]
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });
}

/**
 * 「機種マスタ」シートのA列(機種ID)に、指定の機種IDが既に存在するか確認する
 */
export async function machineIdExists(machineId: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "機種マスタ!A:A",
  });
  const rows = res.data.values ?? [];
  return rows.some((row) => row[0] === machineId);
}

// --- 以下は既存の読み取り処理(暫定：静的データ参照のまま) ---

export async function fetchMachineMasters(): Promise<MachineMaster[]> {
  // TODO: Sheets APIから読み込む処理に置き換える
  return machineMasters;
}

export async function fetchMachineRuleDetails(): Promise<MachineRuleDetail[]> {
  // TODO: Sheets APIから読み込む処理に置き換える
  return machineRuleDetails;
}