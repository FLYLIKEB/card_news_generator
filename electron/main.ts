import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "path";
import * as os from "os";
import * as pty from "node-pty";
import * as chokidar from "chokidar";
import * as fs from "fs";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let ptyProcess: pty.IPty | null = null;
let watcher: chokidar.FSWatcher | null = null;

// output/ 디렉토리 경로 (앱 루트 기준)
const outputDir = isDev
  ? path.join(__dirname, "..", "output")
  : path.join(app.getAppPath(), "output");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#f9fafb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// PTY 세션 시작
function startPty() {
  if (ptyProcess) return;

  const shell = os.platform() === "win32" ? "cmd.exe" : process.env.SHELL ?? "/bin/zsh";
  const cwd = isDev
    ? path.join(__dirname, "..")
    : app.getAppPath();

  ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 120,
    rows: 40,
    cwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
    },
  });

  ptyProcess.onData((data) => {
    mainWindow?.webContents.send("pty:data", data);
  });

  ptyProcess.onExit(({ exitCode }) => {
    mainWindow?.webContents.send("pty:exit", exitCode);
    ptyProcess = null;
  });
}

// chokidar로 output/ 폴더 .pen 파일 감시
function watchOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  watcher = chokidar.watch(path.join(outputDir, "*.pen"), {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on("add", (filePath) => {
    const filename = path.basename(filePath);
    mainWindow?.webContents.send("pen:created", filename);
  });

  watcher.on("change", (filePath) => {
    const filename = path.basename(filePath);
    mainWindow?.webContents.send("pen:changed", filename);
  });
}

// IPC 핸들러
function registerIpc() {
  // PTY 입력 전송
  ipcMain.on("pty:write", (_event, data: string) => {
    ptyProcess?.write(data);
  });

  // PTY 리사이즈
  ipcMain.on("pty:resize", (_event, cols: number, rows: number) => {
    ptyProcess?.resize(cols, rows);
  });

  // PTY 재시작
  ipcMain.on("pty:restart", () => {
    ptyProcess?.kill();
    ptyProcess = null;
    startPty();
  });

  // output/ .pen 파일 목록
  ipcMain.handle("pen-files:list", () => {
    if (!fs.existsSync(outputDir)) return [];
    return fs
      .readdirSync(outputDir)
      .filter((f) => f.endsWith(".pen"))
      .map((name) => ({ name }));
  });

  // .pen 파일 내용 읽기
  ipcMain.handle("pen-files:read", (_event, filename: string) => {
    const filePath = path.join(outputDir, filename);
    if (!fs.existsSync(filePath)) throw new Error("파일 없음");
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  });

  // 외부 링크 열기
  ipcMain.on("shell:openExternal", (_event, url: string) => {
    shell.openExternal(url);
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  startPty();
  watchOutputDir();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  watcher?.close();
  ptyProcess?.kill();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
