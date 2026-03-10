"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import InputPanel from "@/components/InputPanel";
import PreviewPanel from "@/components/PreviewPanel";
import ExportModal from "@/components/ExportModal";
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

  const handleUpdateCard = (page: number, updated: CardPage, _overlayOpacity: number) => {
    if (!cardNews) return;
    setCardNews({
      ...cardNews,
      pages: cardNews.pages.map((p) => (p.page === page ? updated : p)),
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onExport={() => setIsExportOpen(true)} hasCards={!!cardNews} />
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
