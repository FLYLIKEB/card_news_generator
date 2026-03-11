"use client";

import { useEffect, useRef, useCallback } from "react";

interface TerminalPanelProps {
  onPenCreated?: (filename: string) => void;
  className?: string;
}

export default function TerminalPanel({ onPenCreated, className = "" }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xtermRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fitAddonRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || xtermRef.current) return;
    if (typeof window === "undefined" || !window.electronAPI) return;

    // xterm.js 동적 import (SSR 방지)
    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    await import("@xterm/xterm/css/xterm.css");

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
        black: "#484f58",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // PTY 데이터 → 터미널 출력
    const offData = window.electronAPI.onPtyData((data) => {
      term.write(data);
    });

    // PTY 종료 알림
    const offExit = window.electronAPI.onPtyExit((code) => {
      term.writeln(`\r\n\x1b[33m[프로세스 종료: ${code}]\x1b[0m`);
    });

    // .pen 파일 생성 감지
    const offPenCreated = window.electronAPI.onPenCreated((filename) => {
      term.writeln(`\r\n\x1b[32m[.pen 파일 생성됨: ${filename}]\x1b[0m`);
      onPenCreated?.(filename);
    });

    // 키 입력 → PTY
    term.onData((data) => {
      window.electronAPI?.ptyWrite(data);
    });

    // 리사이즈
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      const { cols, rows } = term;
      window.electronAPI?.ptyResize(cols, rows);
    });
    resizeObserver.observe(terminalRef.current);

    cleanupRef.current = [
      offData,
      offExit,
      offPenCreated,
      () => resizeObserver.disconnect(),
      () => term.dispose(),
    ];
  }, [onPenCreated]);

  useEffect(() => {
    initTerminal();
    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [initTerminal]);

  const sendCommand = (cmd: string) => {
    window.electronAPI?.ptyWrite(cmd + "\r");
  };

  return (
    <div className={`flex flex-col bg-[#0d1117] ${className}`}>
      {/* 툴바 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs text-[#8b949e] font-medium">터미널</span>
        <div className="flex-1" />
        <button
          onClick={() => sendCommand("/card-generate")}
          className="px-3 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors font-medium"
        >
          카드뉴스 생성
        </button>
        <button
          onClick={() => window.electronAPI?.ptyRestart()}
          className="px-3 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] rounded-md transition-colors"
        >
          재시작
        </button>
      </div>

      {/* xterm.js 컨테이너 */}
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 p-2"
        style={{ overflow: "hidden" }}
      />

      {!window?.electronAPI && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] text-[#8b949e] text-sm">
          Electron 앱에서만 사용 가능합니다.
        </div>
      )}
    </div>
  );
}
