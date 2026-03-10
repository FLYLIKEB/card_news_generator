# 카드뉴스 에디터 — Claude 룰

> 이 프로젝트의 모든 작업은 [PLAN.md](./PLAN.md)를 기준으로 한다.

---

## 프로젝트 핵심 원칙

1. **편집 가능한 결과물** — 텍스트를 이미지에 직접 굽지 않는다. 항상 레이어로 분리하고, 내보낼 때만 flatten한다.
2. **배경 이미지 자동 포함** — 글 생성 시 Unsplash 키워드 검색으로 배경 이미지를 함께 넣는다.
3. **인간이 마지막으로 손볼 여지** — 자동화는 좋은 초안을 만드는 것이 목표. 완벽한 결과물은 사람이 완성한다.

---

## 기술 스택 (변경 금지)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js (React) + Tailwind CSS |
| 글 분석 | Claude API `claude-sonnet-4-6` |
| 결과물 포맷 | pencil.dev `.pen` (JSON 기반) |
| 배경 이미지 | Unsplash API (키워드 검색) |
| 이미지 AI 생성 (fallback) | Google Gemini Image API → Replicate → FAL.ai |
| 내보내기 | `.pen` → PNG, JSZip (ZIP 일괄) |

- 이미지 생성 API 우선순위: **Unsplash 검색 → Gemini → Replicate → FAL.ai** 순으로 시도한다.
- Figma MCP는 사용하지 않는다. pencil.dev로 통일한다.
- 결과물을 HTML → PNG로 직접 뽑지 않는다. 반드시 `.pen` 포맷을 거친다.

---

## 폴더 구조

```
card-news-project/
├── input/              # 원본 글 텍스트
├── references/         # 디자인 레퍼런스 스크린샷
├── strategy/           # 에이전트별 전략 MD + SOP
│   ├── editor.md
│   ├── copywriter.md
│   └── artdirector.md
├── output/             # 생성된 .pen 파일
└── export/             # 최종 PNG 이미지
```

- 파일을 찾을 때는 위 폴더 구조를 먼저 확인한다.
- 새로운 결과물은 반드시 `output/` 또는 `export/`에 저장한다.

---

## 에이전트 구조

### 파이프라인 순서
```
오케스트레이터
    ↓
편집장 (글 분석 → 구성안 JSON)
    ↓ (병렬)
카피라이터 + 아트디렉터
    ↓
퍼블리셔 (.pen 파일 생성)
```

### 각 에이전트 원칙
- **편집장**: 글의 핵심만 추출. 페이지당 헤드라인 1문장 + 서브텍스트 1~2문장 이내.
- **카피라이터**: 인스타그램 카드뉴스 문체. 짧고 강하게. 줄임말·이모지 지양.
- **아트디렉터**: `imageKeyword`는 반드시 **영문**으로 생성. 텍스트 가독성을 위해 단순한 이미지 유도.
- **퍼블리셔**: 카피라이터 + 아트디렉터 결과를 병합해 `.pen` JSON 생성.

### 에이전트 전략서 위치
- 각 에이전트의 역할 정의, SOP는 `strategy/` 폴더의 MD 파일로 관리한다.
- 프롬프트를 수정할 때는 코드가 아닌 해당 MD 파일을 수정한다.

---

## 코딩 규칙

### API Routes
- Claude 호출: `/api/analyze`
- 이미지 검색: `/api/image`
- 모든 API Route는 Next.js App Router 기반 (`app/api/`)

### 이미지 레이어 구조
```
배경 이미지 (PNG URL)
    ↓ Canvas에 렌더링
텍스트 레이어 (별도 object, 편집 가능)
    ↓ 내보내기 시만
flatten → PNG blob → 다운로드
```
- 텍스트와 배경을 절대 미리 합치지 않는다.

### 인스타그램 비율
- 1:1 → 1080 × 1080px
- 4:5 → 1080 × 1350px
- 9:16 → 1080 × 1920px

### 환경변수
```
ANTHROPIC_API_KEY=
UNSPLASH_ACCESS_KEY=
GEMINI_API_KEY=        # fallback용
```

---

## 작업 시 체크리스트

새 기능 구현 전:
- [ ] PLAN.md의 MVP 범위에 포함된 기능인가?
- [ ] 텍스트-이미지 레이어 분리 원칙을 지키는가?
- [ ] 결과물이 `output/` 또는 `export/`에 저장되는가?

코드 작성 시:
- [ ] 이미지 소스는 Unsplash → fallback 순서를 지키는가?
- [ ] `.pen` 포맷을 우회하는 경로(HTML→PNG 직접 변환 등)는 없는가?
- [ ] API 키는 환경변수에서만 참조하는가?

---

## MVP 완료 기준

- [ ] 텍스트 입력 → 카드뉴스 페이지 자동 분할
- [ ] 페이지별 배경 이미지 자동 포함 (Unsplash)
- [ ] 배경 이미지 개별 재탐색 (재생성 버튼)
- [ ] 텍스트 기본 편집 (위치, 색상, 오버레이)
- [ ] PNG 저장 (페이지별 + ZIP 전체)

위 5개가 모두 동작하면 MVP 완료.

---

## Git 커밋 규칙

- 커밋 메시지 형식: `feat: 이슈#N — 작업 내용 요약`
- 이슈를 닫을 때: 커밋 메시지 본문에 `closes #N` 포함
- 이슈 단위로 커밋한다. 여러 이슈를 한 커밋에 섞지 않는다.
- 커밋 후 바로 `git push`까지 실행한다.

---

## Next.js 프로젝트 초기화 주의사항

- `create-next-app`은 디렉토리에 기존 파일이 있으면 실패한다.
- 기존 `.md` 파일 등이 있으면 임시 이동 후 설치 → 복원하는 순서로 처리한다.
- 설치 옵션: `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --no-react-compiler`
- `.env*`를 gitignore하되 `.env.example`은 `!.env.example`로 예외 처리한다.
- 빈 폴더는 git에서 추적되지 않으므로 `.gitkeep` 파일을 추가한다.

---

## 환경변수 관리

- 실제 키는 `.env.local`에만 작성 (gitignore 대상)
- `.env.example`에 키 이름과 발급처 주석만 기록해 커밋한다
- API 키는 코드에 하드코딩 절대 금지, 항상 `process.env.XXX`로 참조

---

## 참고 링크

- [PLAN.md](./PLAN.md) — 전체 기획서
- [GitHub Issues](https://github.com/FLYLIKEB/card_news_generator/issues) — 작업 이슈 목록
- 참조 이슈: [ChaLog#187](https://github.com/FLYLIKEB/ChaLog/issues/187)
