"use client";

import { CardNews, AspectRatio } from "@/types/card";
import CardThumbnail from "./CardThumbnail";
import CardPreview from "./CardPreview";

interface PreviewPanelProps {
  cardNews: CardNews | null;
  selectedPage: number;
  onSelectPage: (page: number) => void;
  aspectRatio: AspectRatio;
  onRegenerate: (page: number) => void;
  isRegenerating: boolean;
}

export default function PreviewPanel({
  cardNews,
  selectedPage,
  onSelectPage,
  aspectRatio,
  onRegenerate,
  isRegenerating,
}: PreviewPanelProps) {
  if (!cardNews) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            글을 입력하고 생성하기를 눌러보세요
          </p>
        </div>
      </div>
    );
  }

  const selectedCard = cardNews.pages.find((p) => p.page === selectedPage);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* 썸네일 목록 */}
      <div className="flex gap-3 px-6 py-4 overflow-x-auto border-b border-gray-200 bg-white">
        {cardNews.pages.map((card) => (
          <CardThumbnail
            key={card.page}
            card={card}
            isSelected={card.page === selectedPage}
            onClick={() => onSelectPage(card.page)}
            aspectRatio={aspectRatio}
          />
        ))}
      </div>

      {/* 선택된 카드 상세 */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {selectedCard && (
          <CardPreview
            card={selectedCard}
            aspectRatio={aspectRatio}
            onRegenerate={() => onRegenerate(selectedCard.page)}
            isRegenerating={isRegenerating}
          />
        )}
      </div>
    </div>
  );
}
