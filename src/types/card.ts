export type AspectRatio = "1:1" | "4:5" | "9:16";

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

export type ImageStyle = "minimal" | "colorful" | "dark" | "light";

export interface EditorSettings {
  aspectRatio: AspectRatio;
  style: ImageStyle;
  pageCount: number;
}
