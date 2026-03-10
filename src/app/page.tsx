"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import InputPanel from "@/components/InputPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { CardNews, CardPage, EditorSettings, PenFile } from "@/types/card";

const DEFAULT_SETTINGS: EditorSettings = {
  aspectRatio: "1:1",
  style: "minimal",
  pageCount: 6,
};

async function fetchImage(
  keyword: string,
  aspectRatio: string,
  page = 1
): Promise<string | undefined> {
  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, aspectRatio, page }),
  });
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.url;
}

export default function Home() {
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [cardNews, setCardNews] = useState<CardNews | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [penFile, setPenFile] = useState<PenFile | null>(null);
  // 페이지별 재탐색 페이지 번호 추적 (같은 키워드, 다른 결과)
  const imagePageRef = useRef<Record<number, number>>({});

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          pageCount: settings.pageCount,
          style: settings.style,
        }),
      });
      if (!res.ok) throw new Error("분석 실패");
      const data: CardNews = await res.json();

      // 모든 페이지 이미지 병렬 fetch
      imagePageRef.current = {};
      const pagesWithImages: CardPage[] = await Promise.all(
        data.pages.map(async (p) => {
          imagePageRef.current[p.page] = 1;
          const imageUrl = await fetchImage(p.imageKeyword, settings.aspectRatio, 1);
          return { ...p, imageUrl };
        })
      );

      const draft: CardNews = { ...data, pages: pagesWithImages };

      // 카피라이터 + 퍼블리셔 실행 (.pen 파일 생성)
      const publishRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNews: draft, aspectRatio: settings.aspectRatio }),
      });
      if (publishRes.ok) {
        const { penFile: pen, cardNews: refined } = await publishRes.json();
        setCardNews(refined);
        setPenFile(pen);
      } else {
        setCardNews(draft);
      }
      setSelectedPage(1);
    } catch (e) {
      console.error(e);
      alert("카드뉴스 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (page: number) => {
    if (!cardNews) return;
    setIsRegenerating(true);
    try {
      const targetPage = cardNews.pages.find((p) => p.page === page);
      if (!targetPage) return;

      // 다음 페이지 번호로 재탐색 (같은 키워드, 다른 이미지)
      const nextImagePage = (imagePageRef.current[page] ?? 1) + 1;
      imagePageRef.current[page] = nextImagePage;

      const imageUrl = await fetchImage(
        targetPage.imageKeyword,
        settings.aspectRatio,
        nextImagePage
      );

      setCardNews({
        ...cardNews,
        pages: cardNews.pages.map((p) =>
          p.page === page ? { ...p, imageUrl } : p
        ),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExport = () => {
    if (penFile) {
      // .pen 파일 다운로드 (JSON)
      const blob = new Blob([JSON.stringify(penFile, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${penFile.title ?? "card-news"}.pen`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // TODO: 이슈#7 — PNG 내보내기 추가
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onExport={handleExport} hasCards={!!cardNews} />
      <div className="flex-1 flex overflow-hidden">
        <InputPanel
          text={text}
          onTextChange={setText}
          settings={settings}
          onSettingsChange={setSettings}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
        <PreviewPanel
          cardNews={cardNews}
          selectedPage={selectedPage}
          onSelectPage={setSelectedPage}
          aspectRatio={settings.aspectRatio}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      </div>
    </div>
  );
}
