"use client";

import { CardPage, AspectRatio } from "@/types/card";

interface CardThumbnailProps {
  card: CardPage;
  isSelected: boolean;
  onClick: () => void;
  aspectRatio: AspectRatio;
}

const RATIO_CLASS: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
};

export default function CardThumbnail({
  card,
  isSelected,
  onClick,
  aspectRatio,
}: CardThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 w-20 rounded-lg overflow-hidden border-2 transition-all ${
        isSelected ? "border-black" : "border-transparent hover:border-gray-300"
      }`}
    >
      <div
        className={`${RATIO_CLASS[aspectRatio]} w-full bg-gray-100 relative`}
      >
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt={card.headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-1">
          <p className="text-white text-[8px] font-medium text-center leading-tight line-clamp-3">
            {card.headline}
          </p>
        </div>
        <span className="absolute top-1 left-1 bg-black/50 text-white text-[8px] rounded px-1">
          {card.page}
        </span>
      </div>
    </button>
  );
}
