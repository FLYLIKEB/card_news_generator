# /card-publish — .pen 파일 생성

카드뉴스 분석 결과(JSON)를 pencil.dev `.pen` 포맷으로 변환합니다.

## 입력

- `$ARGUMENTS` : analyze 결과 JSON 파일 경로 (예: `output/tea_guide_analyze.json`)
- 옵션: `--ratio 1:1|4:5|9:16` (기본 1:1)

## 캔버스 크기

| 비율 | 너비 | 높이 |
|------|------|------|
| 1:1 | 1080 | 1080 |
| 4:5 | 1080 | 1350 |
| 9:16 | 1080 | 1920 |

## 실행 절차

1. `$ARGUMENTS` JSON 파일을 읽는다 (title, pages 배열 포함)
2. 각 페이지를 아래 레이어 구조로 변환한다
3. `output/{title}.pen` 파일로 저장한다

## 레이어 구조 (페이지당)

각 페이지는 다음 레이어를 순서대로 포함한다:

### 1. 배경 이미지 레이어
```json
{
  "type": "image",
  "content": "{imageUrl}",
  "x": 0, "y": 0,
  "width": {canvas_width}, "height": {canvas_height},
  "style": { "objectFit": "cover", "opacity": 1 }
}
```

### 2. 오버레이 레이어
```json
{
  "type": "image",
  "content": "overlay",
  "x": 0, "y": 0,
  "width": {canvas_width}, "height": {canvas_height},
  "style": { "background": "rgba(0,0,0,0.4)" }
}
```

### 3. 헤드라인 텍스트 레이어
```json
{
  "type": "text",
  "content": "{headline}",
  "x": 80,
  "y": "{height * 0.38, 반올림}",
  "width": "{canvas_width - 160}",
  "height": 200,
  "style": {
    "fontSize": 72,
    "fontWeight": "bold",
    "color": "#ffffff",
    "textAlign": "center",
    "lineHeight": 1.3
  }
}
```

### 4. 서브텍스트 레이어 (subtext가 있을 때만)
```json
{
  "type": "text",
  "content": "{subtext}",
  "x": 80,
  "y": "{headline_y + 220}",
  "width": "{canvas_width - 160}",
  "height": 150,
  "style": {
    "fontSize": 36,
    "fontWeight": "normal",
    "color": "rgba(255,255,255,0.85)",
    "textAlign": "center",
    "lineHeight": 1.6
  }
}
```

## .pen 파일 최종 구조

```json
{
  "version": "1.0",
  "title": "{title}",
  "aspectRatio": "{ratio}",
  "slides": [
    {
      "page": 1,
      "width": 1080,
      "height": 1080,
      "layers": [ /* 위 레이어들 */ ]
    }
  ]
}
```

저장 후 파일 경로와 페이지 수를 사용자에게 알려준다.
