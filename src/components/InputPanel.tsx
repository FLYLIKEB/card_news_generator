"use client";

import { useState, useEffect, useRef } from "react";

interface PenFileEntry {
  name: string;
}

interface InputPanelProps {
  onLoadPen: (filename: string) => void;
}

export default function InputPanel({ onLoadPen }: InputPanelProps) {
  const [fileOpen, setFileOpen] = useState(false);
  const [files, setFiles] = useState<PenFileEntry[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fileOpen) return;
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.listPenFiles().then(setFiles);
    } else {
      fetch("/api/pen-files")
        .then((r) => r.json())
        .then((d) => setFiles(d.files ?? []));
    }
  }, [fileOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">카드뉴스 에디터</h1>
        <p className="text-sm text-gray-500 mb-10">
          Claude Code CLI에서 카드뉴스를 생성한 뒤, .pen 파일을 불러와 편집하세요.
        </p>

        {/* CLI 안내 */}
        <div className="mb-8 p-5 bg-white border border-gray-200 rounded-xl text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            카드뉴스 생성 방법
          </p>
          <div className="bg-gray-950 rounded-lg px-4 py-3 font-mono text-sm text-green-400 mb-3">
            /card-generate
          </div>
          <p className="text-xs text-gray-400">
            Claude Code 터미널에서 위 스킬을 실행하면 <code className="bg-gray-100 px-1 rounded">output/</code> 폴더에 .pen 파일이 생성됩니다.
          </p>
        </div>

        {/* 파일 열기 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setFileOpen((v) => !v)}
            className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            .pen 파일 열기
          </button>
          {fileOpen && (
            <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {files.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">
                  output/ 에 .pen 파일 없음
                </p>
              ) : (
                files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      onLoadPen(f.name);
                      setFileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors truncate"
                  >
                    {f.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
