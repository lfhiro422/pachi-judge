// ホール内の弱い電波（Wi-Fi不安定・4G中心）でリクエストが固まったまま
// 返ってこない状況を避けるための、タイムアウト＋自動リトライ付きfetch。

export class FetchTimeoutError extends Error {
  constructor() {
    super("リクエストがタイムアウトしました");
    this.name = "FetchTimeoutError";
  }
}

export interface FetchWithRetryOptions extends RequestInit {
  retries?: number; // 最大リトライ回数（初回含まず。デフォルト2 = 最大3回試行）
  timeoutMs?: number; // 1回あたりのタイムアウト（デフォルト15秒）
  onRetry?: (attempt: number, error: unknown) => void; // リトライ時にUIへ通知するためのフック
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { retries = 2, timeoutMs = 15000, onRetry, ...init } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        // 5xx系やタイムアウトはリトライ対象。4xx系（入力ミス等）はリトライしても無駄なので即座に投げる
        if (res.status >= 500 && attempt < retries) {
          throw new Error(`サーバーエラー (HTTP ${res.status})`);
        }
        return res; // 4xxはそのまま返して呼び出し側でエラー内容を判定させる
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      lastError = isAbort ? new FetchTimeoutError() : err;

      if (attempt === retries) {
        throw lastError;
      }
      onRetry?.(attempt + 1, lastError);
      // 少し待ってから再試行（電波の一時的な瞬断を想定した簡易バックオフ）
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  // ここには到達しないが型のために
  throw lastError instanceof Error ? lastError : new Error("不明なエラー");
}
