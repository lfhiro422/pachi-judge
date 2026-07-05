// ホールの4G/不安定Wi-Fi環境でもアップロードが詰まらないよう、
// 送信前にクライアント側で画像をリサイズ・圧縮するユーティリティ。
// 判定精度に必要な文字（ゲーム数カウンター等）は十分読める解像度を残しつつ、
// ファイルサイズを大きく削減することを狙う。

export interface CompressedImage {
  base64: string; // "data:...;base64," を除いた本体部分
  mediaType: string; // 常に "image/jpeg" に統一
  originalSizeKb: number;
  compressedSizeKb: number;
}

/**
 * 画像ファイルをリサイズ＋JPEG圧縮し、base64文字列として返す。
 * @param file 撮影・選択されたファイル
 * @param maxWidth 長辺の最大ピクセル数（デフォルト1280px。台のカウンター表示が
 *   読み取れる程度は十分残る値として設定。荒れる場合は上げて調整可能）
 * @param quality JPEG品質 0〜1（デフォルト0.75）
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 1280,
  quality = 0.75
): Promise<CompressedImage> {
  const originalSizeKb = Math.round(file.size / 1024);

  // createImageBitmapが使えない環境（古いSafari等）向けのフォールバックはHTMLImageElementで対応
  const bitmap = await loadImage(file);

  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context を取得できませんでした");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("画像の圧縮に失敗しました"))),
      "image/jpeg",
      quality
    );
  });

  const base64 = await blobToBase64(blob);
  const compressedSizeKb = Math.round(blob.size / 1024);

  return {
    base64,
    mediaType: "image/jpeg",
    originalSizeKb,
    compressedSizeKb,
  };
}

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
