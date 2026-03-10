"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import InputPanel from "@/components/InputPanel";
import PreviewPanel from "@/components/PreviewPanel";
import ExportModal from "@/components/ExportModal";
import { AspectRatio, CardNews, CardPage, EditorSettings, PenFile } from "@/types/card";

const DEFAULT_SETTINGS: EditorSettings = {
  aspectRatio: "1:1",
  style: "minimal",
  pageCount: 6,
};

// .pen JSON → CardNews 변환 (preview/page.tsx와 동일한 포맷 지원)
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
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [cardNews, setCardNews] = useState<CardNews | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [penFile, setPenFile] = useState<PenFile | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
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

      imagePageRef.current = {};
      const pagesWithImages: CardPage[] = await Promise.all(
        data.pages.map(async (p) => {
          imagePageRef.current[p.page] = 1;
          const imageUrl = await fetchImage(p.imageKeyword, settings.aspectRatio, 1);
          return { ...p, imageUrl };
        })
      );

      const draft: CardNews = { ...data, pages: pagesWithImages };

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

  const handleLoadPen = async (filename: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pen-files/${filename}`);
      if (!res.ok) throw new Error("파일 로드 실패");
      const pen = await res.json();
      const { cardNews: loaded, aspectRatio } = penToCardNews(pen);
      setCardNews(loaded);
      setSettings((s) => ({ ...s, aspectRatio }));
      setSelectedPage(1);
      imagePageRef.current = {};
    } catch (e) {
      console.error(e);
      alert("파일 로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCard = (page: number, updated: CardPage, _overlayOpacity: number) => {
    if (!cardNews) return;
    setCardNews({
      ...cardNews,
      pages: cardNews.pages.map((p) => (p.page === page ? updated : p)),
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onExport={() => setIsExportOpen(true)} hasCards={!!cardNews} onLoadPen={handleLoadPen} />
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
          onUpdateCard={handleUpdateCard}
        />
      </div>

      {isExportOpen && cardNews && (
        <ExportModal
          cardNews={cardNews}
          aspectRatio={settings.aspectRatio}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}
