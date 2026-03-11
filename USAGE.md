# 카드뉴스 에디터 — 사용법

## 빠른 시작

```bash
# 방법 1) 웹 UI에서 전부 해결
npm run dev
# → http://localhost:3000 → 텍스트 입력 → 생성하기 → 편집 → 내보내기

# 방법 2) Claude Code CLI에서 생성 → 웹에서 편집
/card-draft 커피 종류 아메리카노 라떼 콜드브루 차이점
/card-generate input/coffee_guide.txt --pages 6 --ratio 1:1
npm run dev
# → http://localhost:3000 → 파일 열기 → 내보내기
```

---

## 구조

```
웹 UI (생성 + 편집 + 내보내기)         Claude Code CLI (생성)
─────────────────────────────        ─────────────────
텍스트 입력 → 생성하기                 /card-draft     메모 → txt
  → Claude Code subprocess 실행       /card-generate  txt → .pen
  → .pen 자동 로드 → 편집 → PNG
```

웹 UI에서 "생성하기" 버튼을 누르면 백그라운드에서 Claude Code CLI가 실행됩니다.
CLI에서 직접 스킬을 실행해도 동일한 결과를 얻을 수 있습니다.

**요구 사항**: `claude` CLI가 로컬에 설치되어 있어야 합니다.

---

## 스킬 목록

### /card-draft — 메모 → 텍스트 정리

대충 쓴 메모를 카드뉴스용 텍스트로 정리합니다.

```
/card-draft 요즘 주식 시작하는 사람 많은데 ETF부터 시작하라고
/card-draft 아침 루틴 5시 기상 운동 명상 --tone fun
```

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--file` | 저장할 파일명 | 자동 생성 |
| `--tone` | `casual` / `formal` / `fun` | `casual` |

결과: `input/{파일명}.txt`

### /card-generate — 텍스트 → .pen 한 번에

분석 + 이미지 검색 + .pen 생성을 한 번에 실행합니다.

```
/card-generate input/coffee_guide.txt --pages 6 --ratio 1:1
```

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--pages` | 페이지 수 | 6 |
| `--ratio` | `1:1` / `4:5` / `9:16` | `1:1` |
| `--style` | `minimal` / `colorful` / `dark` / `light` | `minimal` |

결과: `output/{제목}.pen`

### 개별 스킬 (필요할 때만)

| 스킬 | 설명 | 입력 → 결과 |
|------|------|-------------|
| `/card-analyze` | 텍스트 → 페이지 분할 | txt → `output/*_analyze.json` |
| `/card-image` | Unsplash 이미지 검색 | json 또는 키워드 → json에 URL 추가 |
| `/card-publish` | .pen 파일 조립 | json → `output/*.pen` |

---

## 웹 UI — 생성 + 편집 + 내보내기

```bash
npm run dev
```

`http://localhost:3000` 에서:

1. **텍스트 입력** — 카드뉴스로 만들 글 입력
2. **설정** — 비율(1:1/4:5/9:16), 스타일, 페이지 수 선택
3. **생성하기** — Claude Code CLI가 백그라운드에서 실행 (30~60초)
4. **편집** — 텍스트 수정, 배경 재검색, 오버레이 조절
5. **내보내기** — 페이지별 PNG 또는 전체 ZIP 다운로드

기존 .pen 파일도 "파일 열기"로 로드할 수 있습니다.

---

## 폴더 구조

```
input/          텍스트 원본 (.txt)
output/         분석 JSON + .pen 파일
export/         PNG 이미지
```

## 캔버스 크기

| 비율 | 크기 |
|------|------|
| 1:1 | 1080 x 1080 |
| 4:5 | 1080 x 1350 |
| 9:16 | 1080 x 1920 |

---

## MCP (Model Context Protocol)

Claude Code를 외부 도구와 연결하는 프로토콜입니다.

| MCP 서버 | 용도 |
|----------|------|
| Playwright MCP | 브라우저 자동화 |
| Supabase MCP | 데이터베이스 쿼리 실행 |
| Firecrawl MCP | 웹 스크래핑 |
| GitHub MCP | PR 관리, 이슈 관리 |

설정 방법:

```bash
# Claude Code 설정에서 MCP 서버 추가
claude mcp add playwright -- npx @anthropic-ai/mcp-playwright
claude mcp add github -- npx @modelcontextprotocol/server-github
```

이 프로젝트에서는 GitHub MCP가 이미 연결되어 있어 PR/이슈 관리에 활용됩니다.
