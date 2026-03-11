"use client";

import { useEffect, useRef, useState } from "react";

interface PenFileEntry {
  name: string;
}

interface HeaderProps {
  onExport: () => void;
  hasCards: boolean;
  onLoadPen: (filename: string) => void;
  onNew: () => void;
  onToggleTerminal?: () => void;
  showTerminal?: boolean;
}

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

export default function Header({ onExport, hasCards, onLoadPen, onNew, onToggleTerminal, showTerminal }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PenFileEntry[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (isElectron && window.electronAPI) {
      window.electronAPI.listPenFiles().then((list) => setFiles(list));
    } else {
      fetch("/api/pen-files")
        .then((r) => r.json())
        .then((d) => setFiles(d.files ?? []));
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">카드뉴스 에디터</h1>
      <div className="flex items-center gap-2">
        {/* 새 카드뉴스 */}
        <button
          onClick={onNew}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
        >
          새 카드뉴스
        </button>
        {/* .pen 파일 불러오기 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            파일 열기
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {files.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">output/ 에 .pen 파일 없음</p>
              ) : (
                files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => { onLoadPen(f.name); setOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors truncate"
                  >
                    {f.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {/* 터미널 토글 (Electron 전용) */}
        {isElectron && onToggleTerminal && (
          <button
            onClick={onToggleTerminal}
            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
              showTerminal
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            터미널
          </button>
        )}
        <button
          onClick={onExport}
          disabled={!hasCards}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          내보내기
        </button>
      </div>
    </header>
  );
}
