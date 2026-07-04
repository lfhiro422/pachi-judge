"use client";

/**
 * app/admin/add-machine/page.tsx
 *
 * 機種データ半自動登録画面。
 * 1. 攻略サイトから集めた「事実」の断片を貼り付ける
 * 2. Claude APIが機種マスタ・機種ルール詳細の下書きを構造化生成
 * 3. 人がその場で確認・修正（テキストエリアで直接編集）
 * 4. 「シートに登録」でGoogle Sheetsへ追記
 *
 * 認証は入れていない。社内用/自分専用ツールとして使う想定なら、
 * まずは Vercel の「Deployment Protection」等でこのパス自体を
 * 保護することを推奨（README的な注意書きとしてページ下部にも記載）。
 */

import { useState } from "react";
import type { ExtractedMachine } from "@/lib/machine-schema";

type Step = "input" | "review" | "done";

export default function AddMachinePage() {
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<ExtractedMachine | null>(null);
  const [draftJsonText, setDraftJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ machineId: string; rulesAdded: number } | null>(null);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/extract-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "抽出に失敗しました");
      setDraft(data.draft);
      setDraftJsonText(JSON.stringify(data.draft, null, 2));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(draftJsonText);
      const res = await fetch("/api/admin/commit-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "書き込みに失敗しました");
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("input");
    setRawText("");
    setDraft(null);
    setDraftJsonText("");
    setError(null);
    setResult(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900">機種データを登録</h1>
      <p className="mt-1 text-sm text-neutral-500">
        攻略サイトの数値・条件を貼り付けると、機種マスタと機種ルール詳細の下書きを自動生成します。
      </p>

      <ol className="mt-6 flex gap-4 text-sm">
        <StepBadge active={step === "input"} done={step !== "input"} label="1. データ入力" />
        <StepBadge active={step === "review"} done={step === "done"} label="2. 確認・修正" />
        <StepBadge active={step === "done"} done={false} label="3. 登録完了" />
      </ol>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === "input" && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-700">
            攻略データ（事実の箇条書き推奨。記事の文章をそのまま貼らない）
          </label>
          <textarea
            className="mt-2 h-72 w-full rounded-md border border-neutral-300 p-3 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            placeholder={
              "例:\n機種名: スマスロ〇〇\nメーカー: 〇〇\n導入日: 2026年〇月〇日\n天井: 〇〇G+α\nゾーン: 〇〇G〜〇〇G\n機械割: 設定1=97.5% 設定6=114.9%\nやめ時: AT終了後〇〇の確認が必要"
            }
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button
            onClick={handleExtract}
            disabled={loading || rawText.trim().length < 20}
            className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? "抽出中…" : "下書きを生成"}
          </button>
        </div>
      )}

      {step === "review" && draft && (
        <div className="mt-6">
          {draft.uncertainFields.length > 0 && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">AIが確認を推奨した項目</p>
              <ul className="mt-1 list-disc pl-5">
                {draft.uncertainFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <label className="block text-sm font-medium text-neutral-700">
            下書き（JSON形式・直接編集可能）
          </label>
          <textarea
            className="mt-2 h-96 w-full rounded-md border border-neutral-300 p-3 font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            value={draftJsonText}
            onChange={(e) => setDraftJsonText(e.target.value)}
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleCommit}
              disabled={loading}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "登録中…" : "この内容でシートに登録"}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              やり直す
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
          <p className="font-medium">
            機種ID「{result.machineId}」を登録しました（ルール {result.rulesAdded} 件追加）。
          </p>
          <button
            onClick={reset}
            className="mt-3 rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-900"
          >
            続けて別の機種を登録
          </button>
        </div>
      )}

     
    </main>
  );
}

function StepBadge({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <li
      className={
        "rounded-full border px-3 py-1 " +
        (active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : done
            ? "border-neutral-300 bg-neutral-100 text-neutral-500"
            : "border-neutral-200 text-neutral-400")
      }
    >
      {label}
    </li>
  );
}
