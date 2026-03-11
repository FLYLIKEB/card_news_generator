import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const outputDir = process.env.CARD_NEWS_OUTPUT_DIR ?? path.join(process.cwd(), "output");
  const filePath = path.join(outputDir, filename);

  if (!fs.existsSync(filePath) || !filename.endsWith(".pen")) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json(JSON.parse(content));
}
