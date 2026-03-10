"use client";

import { useEffect, useState } from "react";
import { CardNews, AspectRatio } from "@/types/card";
import { exportAllAsZip, exportSinglePng } from "@/lib/exportPng";

interface ExportModalProps {
  cardNews: CardNews;
  aspectRatio: AspectRatio;
  onClose: () => void;
}

export default function ExportModal({ cardNews, aspectRatio, onClose }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportAllAsZip(cardNews, aspectRatio);
      setDone(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOne = async (page: number) => {
    setIsExporting(true);
    try {
      const card = cardNews.pages.find((p) => p.page === page)!;
      await exportSinglePng(card, aspectRatio, cardNews.title);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">내보내기</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* 전체 ZIP 다운로드 */}
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="w-full py-3 bg-black text-white text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            {isExporting ? "생성 중..." : `전체 ${cardNews.pages.length}장 ZIP 다운로드`}
          </button>

          {done && (
            <p className="text-xs text-center text-green-600 font-medium">
              다운로드 완료!
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">페이지별</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* 페이지별 개별 다운로드 */}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {cardNews.pages.map((card) => (
              <button
                key={card.page}
                onClick={() => handleExportOne(card.page)}
                disabled={isExporting}
                className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              >
                <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                  <span className="text-gray-400 mr-2">#{card.page}</span>
                  {card.headline}
                </span>
                <span className="text-xs text-gray-400 shrink-0">PNG</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
