"use client";

import { useEffect, useState } from "react";
import { CardPage } from "@/types/card";

interface TextEditModalProps {
  card: CardPage;
  overlayOpacity: number;
  onSave: (updated: CardPage, overlayOpacity: number) => void;
  onClose: () => void;
}

const TEXT_COLORS = [
  { label: "흰색", value: "#ffffff" },
  { label: "검정", value: "#000000" },
  { label: "노랑", value: "#facc15" },
  { label: "하늘", value: "#7dd3fc" },
  { label: "연두", value: "#86efac" },
  { label: "분홍", value: "#f9a8d4" },
];

const FONT_SIZES = [
  { label: "소", value: "sm" },
  { label: "중", value: "base" },
  { label: "대", value: "xl" },
  { label: "특대", value: "2xl" },
];

const ALIGN_OPTIONS = [
  { label: "좌", value: "left" },
  { label: "중앙", value: "center" },
  { label: "우", value: "right" },
];

export interface TextStyle {
  color: string;
  fontSize: string;
  align: string;
}

export default function TextEditModal({
  card,
  overlayOpacity,
  onSave,
  onClose,
}: TextEditModalProps) {
  const [headline, setHeadline] = useState(card.headline);
  const [subtext, setSubtext] = useState(card.subtext ?? "");
  const [opacity, setOpacity] = useState(overlayOpacity);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    color: "#ffffff",
    fontSize: "xl",
    align: "center",
  });

  // ESC로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    onSave(
      { ...card, headline, subtext: subtext.trim() || undefined },
      opacity
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">텍스트 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* 헤드라인 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">헤드라인</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <span className="text-xs text-gray-400 text-right">{headline.length}/20</span>
          </div>

          {/* 서브텍스트 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">서브텍스트 (선택)</label>
            <textarea
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 텍스트 색상 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">텍스트 색상</label>
            <div className="flex gap-2">
              {TEXT_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  title={label}
                  onClick={() => setTextStyle((s) => ({ ...s, color: value }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    textStyle.color === value
                      ? "border-black scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          {/* 글자 크기 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">글자 크기</label>
            <div className="flex gap-2">
              {FONT_SIZES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTextStyle((s) => ({ ...s, fontSize: value }))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    textStyle.fontSize === value
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">텍스트 정렬</label>
            <div className="flex gap-2">
              {ALIGN_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTextStyle((s) => ({ ...s, align: value }))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    textStyle.align === value
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 오버레이 불투명도 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">
              배경 어둡기: <span className="text-gray-900 font-semibold">{Math.round(opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-black"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>투명</span>
              <span>어두움</span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
