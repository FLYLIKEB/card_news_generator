import { contextBridge, ipcRenderer } from "electron";

// 렌더러에서 window.electronAPI 로 접근
contextBridge.exposeInMainWorld("electronAPI", {
  // PTY
  ptyWrite: (data: string) => ipcRenderer.send("pty:write", data),
  ptyResize: (cols: number, rows: number) => ipcRenderer.send("pty:resize", cols, rows),
  ptyRestart: () => ipcRenderer.send("pty:restart"),
  onPtyData: (callback: (data: string) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: string) => callback(data);
    ipcRenderer.on("pty:data", listener);
    return () => ipcRenderer.off("pty:data", listener);
  },
  onPtyExit: (callback: (code: number) => void) => {
    const listener = (_: Electron.IpcRendererEvent, code: number) => callback(code);
    ipcRenderer.on("pty:exit", listener);
    return () => ipcRenderer.off("pty:exit", listener);
  },

  // .pen 파일 감시
  onPenCreated: (callback: (filename: string) => void) => {
    const listener = (_: Electron.IpcRendererEvent, filename: string) => callback(filename);
    ipcRenderer.on("pen:created", listener);
    return () => ipcRenderer.off("pen:created", listener);
  },
  onPenChanged: (callback: (filename: string) => void) => {
    const listener = (_: Electron.IpcRendererEvent, filename: string) => callback(filename);
    ipcRenderer.on("pen:changed", listener);
    return () => ipcRenderer.off("pen:changed", listener);
  },

  // .pen 파일 IPC (Next.js API 대체)
  listPenFiles: (): Promise<{ name: string }[]> =>
    ipcRenderer.invoke("pen-files:list"),
  readPenFile: (filename: string): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke("pen-files:read", filename),

  // 외부 링크
  openExternal: (url: string) => ipcRenderer.send("shell:openExternal", url),

  // Electron 환경 여부
  isElectron: true,
});
