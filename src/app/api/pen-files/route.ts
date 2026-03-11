import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const outputDir = process.env.CARD_NEWS_OUTPUT_DIR ?? path.join(process.cwd(), "output");

  if (!fs.existsSync(outputDir)) {
    return NextResponse.json({ files: [] });
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".pen"))
    .map((f) => ({ name: f, path: f }));

  return NextResponse.json({ files });
}
