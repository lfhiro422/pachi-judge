import { NextRequest, NextResponse } from "next/server";
import { fetchMachineMasters } from "@/lib/sheets";
import { identifyMachineFromImage } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imageBase64, imageMediaType } = body as {
    imageBase64?: string;
    imageMediaType?: string;
  };

  if (!imageBase64 || !imageMediaType) {
    return NextResponse.json(
      { matchedMachineId: null, detectedText: "", confidence: "low" },
      { status: 400 }
    );
  }

  try {
    const machines = await fetchMachineMasters();
    const result = await identifyMachineFromImage(
      imageBase64,
      imageMediaType,
      machines
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("identify-machine failed:", err);
    // 機種名自動認識はあくまで補助機能。失敗しても判定フロー自体は止めない。
    return NextResponse.json(
      { matchedMachineId: null, detectedText: "", confidence: "low" },
      { status: 200 }
    );
  }
}
