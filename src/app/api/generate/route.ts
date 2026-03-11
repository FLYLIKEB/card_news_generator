import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import {
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  existsSync,
} from "fs";
import { join, resolve } from "path";

export interface TaskState {
  status: "pending" | "running" | "done" | "error";
  progress: string;
  filename: string | null;
  error: string | null;
  startedAt: number;
  logs: string[];
}

const PROJECT_ROOT = resolve(process.cwd());
const OUTPUT_DIR = process.env.CARD_NEWS_OUTPUT_DIR || join(PROJECT_ROOT, "output");
const INPUT_DIR = join(PROJECT_ROOT, "input");
const TASKS_DIR = "/tmp/card-news-tasks";

// 파일 기반 task 저장 (HMR에 안전)
function ensureTasksDir() {
  if (!existsSync(TASKS_DIR)) mkdirSync(TASKS_DIR, { recursive: true });
}

function saveTask(taskId: string, task: TaskState) {
  ensureTasksDir();
  writeFileSync(join(TASKS_DIR, `${taskId}.json`), JSON.stringify(task), "utf-8");
}

export function getTask(taskId: string): TaskState | undefined {
  const path = join(TASKS_DIR, `${taskId}.json`);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return undefined;
  }
}

// claude CLI 절대 경로
const CLAUDE_BIN = (() => {
  try {
    return execSync("which claude", { encoding: "utf-8" }).trim();
  } catch {
    return "claude";
  }
})();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, pageCount = 6, aspectRatio = "1:1", style = "minimal" } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "텍스트를 입력해주세요." }, { status: 400 });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 텍스트를 input/ 에 저장
    const inputFilename = `${taskId}.txt`;
    const inputPath = join(INPUT_DIR, inputFilename);
    writeFileSync(inputPath, text, "utf-8");

    // task 상태 초기화 (파일에 저장)
    const task: TaskState = {
      status: "running",
      progress: "Claude Code 실행 중...",
      filename: null,
      error: null,
      startedAt: Date.now(),
      logs: [],
    };
    saveTask(taskId, task);

    // 기존 .pen 파일 목록
    const existingPenFiles = new Set(
      readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".pen"))
    );

    // claude CLI subprocess 실행
    const prompt = `input/${inputFilename} 파일을 읽고 카드뉴스를 만들어줘. --pages ${pageCount} --ratio ${aspectRatio} --style ${style}. /card-generate 스킬의 절차대로 실행해줘.`;

    const spawnEnv = { ...process.env };
    // Claude Code 중첩 세션 방지: 관련 환경변수 모두 삭제
    for (const key of Object.keys(spawnEnv)) {
      if (key.startsWith("CLAUDE") || key.startsWith("CURSOR_SPAWN")) {
        delete spawnEnv[key];
      }
    }

    const proc = spawn(CLAUDE_BIN, ["-p", prompt], {
      cwd: PROJECT_ROOT,
      env: spawnEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.on("error", (err) => {
      task.status = "error";
      task.error = `Claude CLI 실행 실패: ${err.message}`;
      saveTask(taskId, task);
    });

    let stdoutOutput = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      const t = chunk.toString();
      stdoutOutput += t;
      // 줄 단위로 로그 누적 (빈 줄 제외, 최대 200줄)
      const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
      task.logs = [...task.logs, ...lines].slice(-200);
      if (t.includes("분석") || t.includes("analyze")) {
        task.progress = "텍스트 분석 중...";
      } else if (t.includes("Unsplash") || t.includes("이미지") || t.includes("image")) {
        task.progress = "배경 이미지 검색 중...";
      } else if (t.includes(".pen") || t.includes("publish") || t.includes("생성")) {
        task.progress = ".pen 파일 생성 중...";
      }
      saveTask(taskId, task);
    });

    let stderrOutput = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
      console.error("[claude stderr]", chunk.toString());
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        task.status = "error";
        const errorDetail = stderrOutput || stdoutOutput;
        task.error = `Claude Code가 비정상 종료되었습니다 (code: ${code}): ${errorDetail.slice(-300)}`;
        saveTask(taskId, task);
        return;
      }

      try {
        const currentPenFiles = readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".pen"));
        const newFiles = currentPenFiles.filter((f) => !existingPenFiles.has(f));

        if (newFiles.length > 0) {
          const newest = newFiles
            .map((f) => ({ name: f, mtime: statSync(join(OUTPUT_DIR, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime)[0];
          task.filename = newest.name;
        } else {
          const latest = currentPenFiles
            .map((f) => ({ name: f, mtime: statSync(join(OUTPUT_DIR, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime)[0];
          task.filename = latest?.name ?? null;
        }

        if (task.filename) {
          task.status = "done";
          task.progress = "완료!";
        } else {
          task.status = "error";
          task.error = ".pen 파일이 생성되지 않았습니다.";
        }
      } catch (e) {
        task.status = "error";
        task.error = `파일 확인 중 오류: ${e}`;
      }
      saveTask(taskId, task);
    });

    // 2분 타임아웃
    setTimeout(() => {
      const current = getTask(taskId);
      if (current && current.status === "running") {
        task.status = "error";
        task.error = "생성 시간이 초과되었습니다 (2분).";
        saveTask(taskId, task);
        proc.kill();
      }
    }, 120_000);

    return NextResponse.json({ taskId });
  } catch (e) {
    return NextResponse.json(
      { error: `서버 오류: ${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
}
