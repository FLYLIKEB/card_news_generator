export interface ElectronAPI {
  // PTY
  ptyWrite: (data: string) => void;
  ptyResize: (cols: number, rows: number) => void;
  ptyRestart: () => void;
  onPtyData: (callback: (data: string) => void) => () => void;
  onPtyExit: (callback: (code: number) => void) => () => void;

  // .pen 파일 감시
  onPenCreated: (callback: (filename: string) => void) => () => void;
  onPenChanged: (callback: (filename: string) => void) => () => void;

  // .pen 파일 IPC
  listPenFiles: () => Promise<{ name: string }[]>;
  readPenFile: (filename: string) => Promise<Record<string, unknown>>;

  // 외부 링크
  openExternal: (url: string) => void;

  // Electron 여부
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
