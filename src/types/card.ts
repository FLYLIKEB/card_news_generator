export type AspectRatio = "1:1" | "4:5" | "9:16";

export type ImageStyle = "minimal" | "colorful" | "dark" | "light";

export interface CardPage {
  page: number;
  headline: string;
  subtext?: string;
  imageKeyword: string;
  imageUrl?: string;
}

export interface CardNews {
  title: string;
  pages: CardPage[];
}

export interface EditorSettings {
  aspectRatio: AspectRatio;
  style: ImageStyle;
  pageCount: number;
}

// pencil.dev .pen 파일 포맷 (JSON 기반)
export interface PenLayer {
  type: "text" | "image";
  content: string;       // 텍스트 내용 or 이미지 URL
  x: number;
  y: number;
  width: number;
  height: number;
  style?: Record<string, string | number | undefined>;
}

export interface PenSlide {
  page: number;
  width: number;
  height: number;
  layers: PenLayer[];
}

export interface PenFile {
  version: "1.0";
  title: string;
  aspectRatio: AspectRatio;
  slides: PenSlide[];
}
