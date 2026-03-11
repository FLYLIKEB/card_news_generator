"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import PreviewPanel from "@/components/PreviewPanel";
import ExportModal from "@/components/ExportModal";
import InputPanel from "@/components/InputPanel";
import { AspectRatio, CardNews, CardPage } from "@/types/card";

// .pen JSON → CardNews 변환
function penToCardNews(pen: Record<string, unknown>): { cardNews: CardNews; aspectRatio: AspectRatio } {
  const aspectRatio = (pen.aspectRatio as AspectRatio) ?? "1:1";
  const pages = (pen.pages as Record<string, unknown>[]) ?? [];

  const cardPages: CardPage[] = pages.map((p) => ({
    page: p.page as number,
    headline: p.headline as string,
    subtext: p.subtext as string | undefined,
    imageKeyword: p.imageKeyword as string,
    imageUrl: ((p.background as Record<string, unknown>)?.url as string) ?? undefined,
  }));

  return {
    cardNews: { title: pen.title as string, pages: cardPages },
    aspectRatio,
  };
}

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
  const [cardNews, setCardNews] = useState<CardNews | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedPage, setSelectedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const imagePageRef = useRef<Record<number, number>>({});

  const handleLoadPen = useCallback(async (filename: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pen-files/${filename}`);
      if (!res.ok) throw new Error("파일 로드 실패");
      const pen = await res.json();
      const { cardNews: loaded, aspectRatio: ratio } = penToCardNews(pen);
      setCardNews(loaded);
      setAspectRatio(ratio);
      setSelectedPage(1);
      imagePageRef.current = {};
    } catch (e) {
      console.error(e);
      alert("파일 로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNew = useCallback(() => {
    setCardNews(null);
  }, []);

  const handleRegenerate = async (page: number) => {
    if (!cardNews) return;
    setIsRegenerating(true);
    try {
      const targetPage = cardNews.pages.find((p) => p.page === page);
      if (!targetPage) return;

      const nextImagePage = (imagePageRef.current[page] ?? 1) + 1;
      imagePageRef.current[page] = nextImagePage;

      const imageUrl = await fetchImage(
        targetPage.imageKeyword,
        aspectRatio,
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

  const handleUpdateCard = (page: number, updated: CardPage) => {
    if (!cardNews) return;
    setCardNews({
      ...cardNews,
      pages: cardNews.pages.map((p) => (p.page === page ? updated : p)),
    });
  };

  // 랜딩 화면: cardNews 없을 때
  if (!cardNews) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <InputPanel onLoadPen={handleLoadPen} />
      </div>
    );
  }

  // 편집기 화면: cardNews 있을 때
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onExport={() => setIsExportOpen(true)}
        hasCards={!!cardNews}
        onLoadPen={handleLoadPen}
        onNew={handleNew}
      />
      <PreviewPanel
        cardNews={cardNews}
        selectedPage={selectedPage}
        onSelectPage={setSelectedPage}
        aspectRatio={aspectRatio}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        onUpdateCard={handleUpdateCard}
        isLoading={isLoading}
      />

      {isExportOpen && cardNews && (
        <ExportModal
          cardNews={cardNews}
          aspectRatio={aspectRatio}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}
