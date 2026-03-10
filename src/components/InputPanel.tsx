"use client";

import { AspectRatio, EditorSettings, ImageStyle } from "@/types/card";

interface InputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "9:16", value: "9:16" },
];

const IMAGE_STYLES: { label: string; value: ImageStyle }[] = [
  { label: "미니멀", value: "minimal" },
  { label: "컬러풀", value: "colorful" },
  { label: "다크", value: "dark" },
  { label: "라이트", value: "light" },
];

export default function InputPanel({
  text,
  onTextChange,
  settings,
  onSettingsChange,
  onGenerate,
  isLoading,
}: InputPanelProps) {
  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            글 입력
          </label>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="카드뉴스로 만들 글을 입력하세요..."
            className="w-full h-52 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            설정
          </label>

          {/* 비율 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-600">비율</span>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() =>
                    onSettingsChange({ ...settings, aspectRatio: value })
                  }
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    settings.aspectRatio === value
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 스타일 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-600">스타일</span>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_STYLES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() =>
                    onSettingsChange({ ...settings, style: value })
                  }
                  className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    settings.style === value
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 페이지 수 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-600">
              페이지 수:{" "}
              <span className="font-medium text-gray-900">
                {settings.pageCount}장
              </span>
            </span>
            <input
              type="range"
              min={3}
              max={10}
              value={settings.pageCount}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  pageCount: Number(e.target.value),
                })
              }
              className="w-full accent-black"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>3</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onGenerate}
          disabled={!text.trim() || isLoading}
          className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {isLoading ? "생성 중..." : "생성하기"}
        </button>
      </div>
    </aside>
  );
}
