"use client";

import { useState } from "react";
import { CardPage, AspectRatio } from "@/types/card";
import TextEditModal from "./TextEditModal";

interface CardPreviewProps {
  card: CardPage;
  aspectRatio: AspectRatio;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onUpdateCard: (updated: CardPage, overlayOpacity: number) => void;
}

const RATIO_CLASS: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
};

const RATIO_LABEL: Record<AspectRatio, string> = {
  "1:1": "1080 × 1080",
  "4:5": "1080 × 1350",
  "9:16": "1080 × 1920",
};

export default function CardPreview({
  card,
  aspectRatio,
  onRegenerate,
  isRegenerating,
  onUpdateCard,
}: CardPreviewProps) {
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        {/* 카드 미리보기 */}
        <div
          className={`relative w-full ${RATIO_CLASS[aspectRatio]} rounded-xl overflow-hidden shadow-lg bg-gray-100`}
        >
          {/* 배경 이미지 레이어 */}
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
          )}

          {/* 오버레이 레이어 — 불투명도 동적 적용 */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />

          {/* 텍스트 레이어 — 배경과 분리, 편집 가능 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-white text-2xl font-bold leading-snug drop-shadow-md">
              {card.headline}
            </p>
            {card.subtext && (
              <p className="mt-3 text-white/80 text-sm leading-relaxed drop-shadow">
                {card.subtext}
              </p>
            )}
          </div>

          {/* 페이지 번호 */}
          <span className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
            {card.page}
          </span>
        </div>

        <p className="text-xs text-gray-400">{RATIO_LABEL[aspectRatio]}px</p>

        {/* 액션 버튼 */}
        <div className="flex gap-2 w-full">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRegenerating ? "탐색 중..." : "배경 재탐색"}
          </button>
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex-1 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            텍스트 편집
          </button>
        </div>
      </div>

      {/* 텍스트 편집 모달 */}
      {isEditOpen && (
        <TextEditModal
          card={card}
          overlayOpacity={overlayOpacity}
          onSave={(updated, newOpacity) => {
            setOverlayOpacity(newOpacity);
            onUpdateCard(updated, newOpacity);
          }}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  );
}
