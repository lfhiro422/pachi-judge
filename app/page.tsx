"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="flex flex-col flex-1 items-center px-4 py-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="w-full mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">パチ判定</h1>
        <p className="text-sm text-gray-500 mt-1">台を撮影してGO/STAY/STOPを判定</p>
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
        /* --- 撮影後（プレビュー） --- */
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

          {/* 判定ボタン（将来実装）*/}
          <button
            disabled
            className="w-full max-w-xs py-4 px-6 rounded-2xl bg-green-600 text-white text-lg font-semibold shadow-lg opacity-50 cursor-not-allowed flex items-center justify-center gap-3"
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
            判定する（準備中）
          </button>

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
