import { NextResponse } from "next/server";
import { fetchMachineMasters } from "@/lib/sheets";

// Google Sheets APIへの通信を含むため、タイムアウト対策として延長。
export const maxDuration = 60;

export async function GET() {
  const machines = await fetchMachineMasters();
  return NextResponse.json({ machines });
}
