"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import PreviewPanel from "@/components/PreviewPanel";
import ExportModal from "@/components/ExportModal";
import InputPanel from "@/components/InputPanel";
import TerminalPanel from "@/components/TerminalPanel";
import { AspectRatio, CardNews, CardPage } from "@/types/card";

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

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
  // Electron 전용: 터미널 패널 표시 여부
  const [showTerminal, setShowTerminal] = useState(isElectron);
  const imagePageRef = useRef<Record<number, number>>({});

  const handleLoadPen = useCallback(async (filename: string) => {
    setIsLoading(true);
    try {
      let pen: Record<string, unknown>;

      if (isElectron && window.electronAPI) {
        // Electron: IPC로 직접 읽기
        pen = await window.electronAPI.readPenFile(filename);
      } else {
        // 웹: Next.js API route
        const res = await fetch(`/api/pen-files/${filename}`);
        if (!res.ok) throw new Error("파일 로드 실패");
        pen = await res.json();
      }

      const { cardNews: loaded, aspectRatio: ratio } = penToCardNews(pen);
      setCardNews(loaded);
      setAspectRatio(ratio);
      setSelectedPage(1);
      imagePageRef.current = {};
      // .pen 로드 시 터미널 접기 (선택적)
      // setShowTerminal(false);
    } catch (e) {
      console.error(e);
      alert("파일 로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // chokidar가 .pen 생성 감지 → 자동 로드
  const handlePenCreated = useCallback((filename: string) => {
    handleLoadPen(filename);
  }, [handleLoadPen]);

  const handleNew = useCallback(() => {
    setCardNews(null);
    if (isElectron) setShowTerminal(true);
  }, []);

  // Electron: 창 열릴 때 .pen 파일 목록을 IPC로 조회하도록 InputPanel 대응
  useEffect(() => {
    if (!isElectron) return;
    // Electron 환경에서는 /api/pen-files 대신 IPC 사용
    // InputPanel 내부에서 분기 처리됨 (window.electronAPI 체크)
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

  // Electron 앱: 터미널 + 편집기 분할 레이아웃
  if (isElectron) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header
          onExport={() => setIsExportOpen(true)}
          hasCards={!!cardNews}
          onLoadPen={handleLoadPen}
          onNew={handleNew}
          onToggleTerminal={() => setShowTerminal((v) => !v)}
          showTerminal={showTerminal}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* 편집기 영역 */}
          <div className={`flex-1 overflow-hidden transition-all ${showTerminal ? "w-[60%]" : "w-full"}`}>
            {cardNews ? (
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
            ) : (
              <InputPanel onLoadPen={handleLoadPen} />
            )}
          </div>

          {/* 터미널 패널 */}
          {showTerminal && (
            <div className="w-[40%] border-l border-gray-200 flex flex-col min-h-0">
              <TerminalPanel
                onPenCreated={handlePenCreated}
                className="flex-1 min-h-0"
              />
            </div>
          )}
        </div>

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

  // 웹 브라우저: 기존 레이아웃 유지
  if (!cardNews) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <InputPanel onLoadPen={handleLoadPen} />
      </div>
    );
  }

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
