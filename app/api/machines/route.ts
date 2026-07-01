import { NextResponse } from "next/server";
import { fetchMachineMasters } from "@/lib/sheets";

export async function GET() {
  const machines = await fetchMachineMasters();
  return NextResponse.json({ machines });
}
