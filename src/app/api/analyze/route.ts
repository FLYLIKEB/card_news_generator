import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CardNews } from "@/types/card";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { text, pageCount, style } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "텍스트를 입력해주세요." }, { status: 400 });
  }

  const prompt = `당신은 카드뉴스 편집장입니다. 아래 글을 분석해 인스타그램 카드뉴스 구성안을 JSON으로 출력하세요.

규칙:
- 페이지 수: ${pageCount}장 (첫 페이지는 타이틀 카드)
- 헤드라인: 15자 이내, 단독으로 읽어도 의미 전달
- subtext: 선택 사항, 1~2문장 이내. 필요 없으면 생략
- imageKeyword: Unsplash 검색용 영문 키워드 2~3단어, 이미지 스타일은 "${style}"
- 전체 페이지가 기승전결 흐름을 가져야 함

출력 형식 (JSON만 출력, 다른 텍스트 없이):
{
  "title": "전체 제목",
  "pages": [
    {
      "page": 1,
      "headline": "헤드라인",
      "subtext": "부연 설명",
      "imageKeyword": "english keyword"
    }
  ]
}

---
원본 글:
${text}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "응답 파싱 실패", raw }, { status: 500 });
    }

    const cardNews: CardNews = JSON.parse(jsonMatch[0]);
    return NextResponse.json(cardNews);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
