"use client";

import { useState } from "react";
import Header from "@/components/Header";
import InputPanel from "@/components/InputPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { CardNews, EditorSettings } from "@/types/card";

const DEFAULT_SETTINGS: EditorSettings = {
  aspectRatio: "1:1",
  style: "minimal",
  pageCount: 6,
};

export default function Home() {
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [cardNews, setCardNews] = useState<CardNews | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
      setCardNews(data);
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
    // TODO: 이슈#4 — Unsplash API 연동
    await new Promise((r) => setTimeout(r, 800));
    setCardNews({
      ...cardNews,
      pages: cardNews.pages.map((p) =>
        p.page === page
          ? {
              ...p,
              imageUrl: `https://picsum.photos/seed/${page}-${Date.now()}/1080/1080`,
            }
          : p
      ),
    });
    setIsRegenerating(false);
  };

  const handleExport = () => {
    // TODO: 이슈#7 — PNG 내보내기
    alert("내보내기 기능은 이슈#7에서 구현 예정입니다.");
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
