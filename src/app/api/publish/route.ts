import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CardNews, AspectRatio, PenFile, PenSlide } from "@/types/card";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 비율별 캔버스 크기
const CANVAS_SIZE: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

// 카피라이터: 헤드라인/서브텍스트 다듬기
async function runCopywriter(cardNews: CardNews): Promise<CardNews> {
  const prompt = `당신은 인스타그램 카드뉴스 카피라이터입니다. 아래 카드뉴스 구성안의 헤드라인과 서브텍스트를 인스타그램에 최적화된 문체로 다듬어주세요.

규칙:
- 헤드라인: 15자 이내 엄수, 짧고 강하게
- 서브텍스트: 1~2문장, 독자에게 말 걸듯 자연스럽게
- 줄임말·이모지 금지
- 전체 톤앤매너 일관 유지
- 기존 구조(page, imageKeyword)는 그대로 유지
- JSON만 출력

입력:
${JSON.stringify(cardNews, null, 2)}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return cardNews; // 실패 시 원본 유지
  return JSON.parse(match[0]);
}

// 퍼블리셔: .pen 파일 생성
function buildPenFile(cardNews: CardNews, aspectRatio: AspectRatio): PenFile {
  const { width, height } = CANVAS_SIZE[aspectRatio];

  const slides: PenSlide[] = cardNews.pages.map((p) => ({
    page: p.page,
    width,
    height,
    layers: [
      // 배경 이미지 레이어
      {
        type: "image",
        content: p.imageUrl ?? "",
        x: 0,
        y: 0,
        width,
        height,
        style: { objectFit: "cover", opacity: 1 },
      },
      // 오버레이 레이어
      {
        type: "image",
        content: "overlay",
        x: 0,
        y: 0,
        width,
        height,
        style: { background: "rgba(0,0,0,0.4)" },
      },
      // 헤드라인 텍스트 레이어 (편집 가능)
      {
        type: "text",
        content: p.headline,
        x: 80,
        y: Math.round(height * 0.38),
        width: width - 160,
        height: 200,
        style: {
          fontSize: 72,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.3,
        },
      },
      // 서브텍스트 레이어 (편집 가능, 있을 때만)
      ...(p.subtext
        ? [
            {
              type: "text" as const,
              content: p.subtext,
              x: 80,
              y: Math.round(height * 0.38) + 220,
              width: width - 160,
              height: 150,
              style: {
                fontSize: 36,
                fontWeight: "normal",
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                lineHeight: 1.6,
              },
            },
          ]
        : []),
    ],
  }));

  return { version: "1.0", title: cardNews.title, aspectRatio, slides };
}

export async function POST(req: NextRequest) {
  const { cardNews, aspectRatio } = await req.json() as {
    cardNews: CardNews;
    aspectRatio: AspectRatio;
  };

  if (!cardNews?.pages?.length) {
    return NextResponse.json({ error: "카드뉴스 데이터가 없습니다." }, { status: 400 });
  }

  // 카피라이터 실행 (텍스트 다듬기)
  const refined = await runCopywriter(cardNews);

  // 퍼블리셔: .pen 파일 조립
  const penFile = buildPenFile(refined, aspectRatio);

  return NextResponse.json({ penFile, cardNews: refined });
}
