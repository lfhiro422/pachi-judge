"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MachineSelect from "@/components/MachineSelect";
import SignalLight from "@/components/SignalLight";
import { JudgeResult, MachineMaster } from "@/lib/types";

type Scene = "A" | "B";
type ExceptionAnswer = "yes" | "no" | "unknown";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [scene, setScene] = useState<Scene>("A");
  const [machines, setMachines] = useState<MachineMaster[]>([]);
  const [machineId, setMachineId] = useState("");
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [exceptionAnswer, setExceptionAnswer] = useState<ExceptionAnswer>("unknown");

  const [result, setResult] = useState<JudgeResult | null>(null);
  const [judging, setJudging] = useState(false);

  useEffect(() => {
    fetch("/api/machines")
      .then((r) => r.json())
      .then((data: { machines: MachineMaster[] }) => {
        setMachines(data.machines);
        if (data.machines[0]) setMachineId(data.machines[0].machineId);
      });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setResult(null);
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleJudge() {
    // 注意: 現時点では撮影画像はまだAIに送っていない（次のマイルストーンでClaude Vision APIに接続予定）。
    // 画像から機種名・現在の数値を自動で読み取る前段として、ここでは手入力の内容だけで判定する。
    setJudging(true);
    setResult(null);
    try {
      const body =
        scene === "A"
          ? { scene: "A", machineId, currentCount, resetLikely: false }
          : {
              scene: "B",
              machineId,
              exceptionConditionMet:
                exceptionAnswer === "yes" ? true : exceptionAnswer === "no" ? false : null,
            };

      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setJudging(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 items-center px-4 py-8 max-w-lg mx-auto w-full gap-6">
      {/* Header */}
      <div className="w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900">パチ判定</h1>
        <p className="text-sm text-gray-500 mt-1">台を撮影してGO/STAY/STOPを判定</p>
      </div>

      {/* 場面選択 */}
      <div className="w-full flex rounded-2xl bg-gray-100 p-1 gap-1">
        <button
          onClick={() => {
            setScene("A");
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            scene === "A" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          場面A：着席前判定
        </button>
        <button
          onClick={() => {
            setScene("B");
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            scene === "B" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          場面B：やめ時判定
        </button>
      </div>

      {!previewUrl ? (
        /* --- 撮影前 --- */
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-400">
              <svg
                className="mx-auto mb-2 w-16 h-16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
              <p className="text-sm">ここに画像が表示されます</p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="w-full max-w-xs py-4 px-6 rounded-2xl bg-blue-600 text-white text-lg font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            カメラで撮影
          </button>

          <p className="text-xs text-gray-400 text-center">
            モバイルではカメラが直接起動します
            <br />
            PCではファイル選択ダイアログが開きます
          </p>
        </div>
      ) : (
        /* --- 撮影後（プレビュー＋入力＋判定） --- */
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-full relative rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={previewUrl}
              alt="撮影した画像"
              width={800}
              height={600}
              className="w-full h-auto object-contain bg-black"
              unoptimized
            />
          </div>

          {fileName && (
            <p className="text-xs text-gray-400 truncate w-full text-center">{fileName}</p>
          )}

          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2 w-full text-center">
            現在は画像からの自動読み取り（Claude Vision API）は未接続のため、下記を手入力してください
          </p>

          {/* 機種・状況の入力 */}
          <div className="w-full flex flex-col gap-4 bg-white rounded-2xl p-5 shadow border border-gray-100">
            {machines.length > 0 && (
              <MachineSelect machines={machines} value={machineId} onChange={setMachineId} />
            )}

            {scene === "A" ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-500" htmlFor="count">
                  現在のカウンター（ゲーム数など）
                </label>
                <input
                  id="count"
                  type="number"
                  value={currentCount}
                  onChange={(e) => setCurrentCount(Number(e.target.value))}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 650"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500">
                  即ヤメ厳禁の例外条件に、今の状況は当てはまりますか？
                </p>
                {(
                  [
                    ["yes", "当てはまる"],
                    ["no", "当てはまらない"],
                    ["unknown", "画面だけでは分からない"],
                  ] as [ExceptionAnswer, string][]
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name="exception"
                      checked={exceptionAnswer === value}
                      onChange={() => setExceptionAnswer(value)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleJudge}
            disabled={!machineId || judging}
            className="w-full max-w-xs py-4 px-6 rounded-2xl bg-green-600 text-white text-lg font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {judging ? "判定中…" : "判定する"}
          </button>

          {result && (
            <div className="w-full flex flex-col gap-4">
              <SignalLight judgement={result.judgement} />
              <div className="w-full flex flex-col gap-3 text-sm bg-white rounded-2xl p-5 shadow border border-gray-100">
                <div>
                  <p className="text-gray-400">理由</p>
                  <p className="text-gray-800">{result.reason}</p>
                </div>
                <div>
                  <p className="text-gray-400">参照したルール</p>
                  <p className="text-gray-800 text-xs">{result.referencedRule}</p>
                </div>
                {result.estimatedInvestment && (
                  <div>
                    <p className="text-gray-400">推定投資額</p>
                    <p className="text-gray-800">{result.estimatedInvestment}</p>
                  </div>
                )}
                {result.nextCheckTiming && (
                  <div>
                    <p className="text-gray-400">次の確認タイミング</p>
                    <p className="text-gray-800">{result.nextCheckTiming}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full max-w-xs py-3 px-6 rounded-2xl border-2 border-gray-300 text-gray-600 text-base font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            撮り直す
          </button>
        </div>
      )}
    </main>
  );
}
