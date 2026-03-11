import { NextResponse } from "next/server";
import { getTask } from "../route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = getTask(taskId);

  if (!task) {
    return NextResponse.json({ status: "expired", error: "작업 정보를 찾을 수 없습니다." });
  }

  return NextResponse.json({
    status: task.status,
    progress: task.progress,
    filename: task.filename,
    error: task.error,
    logs: task.logs ?? [],
  });
}
