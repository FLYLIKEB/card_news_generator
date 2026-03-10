import JSZip from "jszip";
import { CardNews, AspectRatio } from "@/types/card";

const CANVAS_SIZE: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

// 이미지 URL → HTMLImageElement (CORS 포함)
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 카드 한 장 → PNG Blob
export async function cardToBlob(
  card: { headline: string; subtext?: string; imageUrl?: string },
  aspectRatio: AspectRatio,
  overlayOpacity = 0.4
): Promise<Blob> {
  const { width, height } = CANVAS_SIZE[aspectRatio];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. 배경 이미지
  if (card.imageUrl) {
    try {
      const img = await loadImage(card.imageUrl);
      // object-fit: cover
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
    } catch {
      ctx.fillStyle = "#d1d5db";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. 오버레이
  ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
  ctx.fillRect(0, 0, width, height);

  // 3. 텍스트 — 배경 flatten 시점에만 합성
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const headlineFontSize = Math.round(width * 0.067); // ~72px @1080
  ctx.font = `bold ${headlineFontSize}px sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;

  const centerX = width / 2;
  const centerY = card.subtext ? height * 0.42 : height / 2;

  // 긴 헤드라인 줄바꿈 처리
  wrapText(ctx, card.headline, centerX, centerY, width - 160, headlineFontSize * 1.3);

  if (card.subtext) {
    const subtextFontSize = Math.round(width * 0.033); // ~36px @1080
    ctx.font = `${subtextFontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.shadowBlur = 4;
    wrapText(
      ctx,
      card.subtext,
      centerX,
      centerY + headlineFontSize * 2.2,
      width - 160,
      subtextFontSize * 1.6
    );
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

// 전체 카드뉴스 → ZIP 다운로드
export async function exportAllAsZip(
  cardNews: CardNews,
  aspectRatio: AspectRatio,
  overlayOpacity = 0.4
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(cardNews.title ?? "card-news")!;

  await Promise.all(
    cardNews.pages.map(async (card) => {
      const blob = await cardToBlob(card, aspectRatio, overlayOpacity);
      folder.file(`page-${String(card.page).padStart(2, "0")}.png`, blob);
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cardNews.title ?? "card-news"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// 단일 카드 PNG 다운로드
export async function exportSinglePng(
  card: { page: number; headline: string; subtext?: string; imageUrl?: string },
  aspectRatio: AspectRatio,
  title: string,
  overlayOpacity = 0.4
): Promise<void> {
  const blob = await cardToBlob(card, aspectRatio, overlayOpacity);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}-page-${String(card.page).padStart(2, "0")}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
