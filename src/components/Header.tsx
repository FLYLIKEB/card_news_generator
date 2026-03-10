"use client";

interface HeaderProps {
  onExport: () => void;
  hasCards: boolean;
}

export default function Header({ onExport, hasCards }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">카드뉴스 에디터</h1>
      <button
        onClick={onExport}
        disabled={!hasCards}
        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        내보내기
      </button>
    </header>
  );
}
