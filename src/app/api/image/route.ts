import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function POST(req: NextRequest) {
  const { keyword, page = 1, aspectRatio = "1:1" } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
  }

  // Unsplash 비율 매핑
  const orientation: Record<string, string> = {
    "1:1": "squarish",
    "4:5": "portrait",
    "9:16": "portrait",
  };

  if (!UNSPLASH_ACCESS_KEY) {
    return NextResponse.json(
      { error: "UNSPLASH_ACCESS_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    query: keyword,
    page: String(page),
    per_page: "1",
    orientation: orientation[aspectRatio] ?? "squarish",
    content_filter: "high",
  });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Unsplash 요청 실패" }, { status: 502 });
  }

  const data = await res.json();
  const photo = data.results?.[0];

  if (!photo) {
    return NextResponse.json({ error: "이미지를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    url: photo.urls.regular,
    thumb: photo.urls.thumb,
    alt: photo.alt_description ?? keyword,
    credit: {
      name: photo.user.name,
      link: photo.user.links.html,
    },
  });
}
