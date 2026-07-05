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

// --- 以下、実際にGoogle Sheetsから読み込む処理 ---
// 失敗時（認証情報未設定・API障害等）はビルドやローカル開発を壊さないよう、
// lib/machines-data.ts のフォールバックデータへ自動的に切り替える。

function toBool(value: string | undefined): boolean {
  return value === "あり";
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value.replace("%", ""));
  return Number.isNaN(n) ? undefined : n;
}

export async function fetchMachineMasters(): Promise<MachineMaster[]> {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "機種マスタ!A2:N",
    });
    const rows = res.data.values ?? [];
    if (rows.length === 0) return machineMasters; // シートが空ならフォールバック

    return rows
      .filter((row) => row[0]) // 機種IDが空の行は無視
      .map((row): MachineMaster => ({
        machineId: row[0],
        machineName: row[1] ?? "",
        maker: row[2] ?? "",
        releaseDate: row[3] ?? "要確認",
        machineType: row[4] ?? "AT機",
        hasCeiling: toBool(row[5]),
        hasZone: toBool(row[6]),
        hasOwnPoint: toBool(row[7]),
        payoutSetting1: toNumberOrUndefined(row[8]),
        payoutSetting6: toNumberOrUndefined(row[9]),
        baseQuitTiming: row[10] ?? "",
        lastConfirmedAt: row[11] ?? "",
        sourceMemo: row[12] ?? "",
        notes: row[13] ?? "",
      }));
  } catch (err) {
    console.error("fetchMachineMasters: falling back to local data.", err);
    return machineMasters;
  }
}

export async function fetchMachineRuleDetails(): Promise<MachineRuleDetail[]> {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "機種ルール詳細!A2:I",
    });
    const rows = res.data.values ?? [];
    if (rows.length === 0) return machineRuleDetails;

    return rows
      .filter((row) => row[0])
      .map((row): MachineRuleDetail => ({
        machineId: row[0],
        // row[1] は「機種名(参照用)」列。型には持たないため読み捨てる。
        category: (row[2] ?? "やめ時") as MachineRuleDetail["category"],
        itemName: row[3] ?? "",
        thresholdRaw: row[4] ?? "",
        triggerCondition: row[5] ?? "",
        benefit: row[6] ?? "",
        targetMemo: row[7] ?? "",
        notes: row[8] ?? "",
      }));
  } catch (err) {
    console.error("fetchMachineRuleDetails: falling back to local data.", err);
    return machineRuleDetails;
  }
}