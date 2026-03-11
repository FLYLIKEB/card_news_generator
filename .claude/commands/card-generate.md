# /card-generate — 카드뉴스 전체 파이프라인

텍스트 입력부터 .pen 파일 생성까지 전체 과정을 한 번에 실행합니다.

## 입력

- `$ARGUMENTS` : 텍스트 내용 또는 텍스트 파일 경로 (예: `input/tea_guide.txt`)
- 옵션: `--pages N` (기본 6), `--ratio 1:1|4:5|9:16` (기본 1:1), `--style minimal|colorful|dark|light` (기본 minimal)

## 실행 파이프라인

### Step 1: 텍스트 분석 (/card-analyze)

입력 텍스트를 카드뉴스 페이지로 분할한다.

- 파일 경로이면 파일을 읽는다
- 핵심 메시지를 N개 페이지로 분할
- 각 페이지: headline(15자 이내), subtext(선택), imageKeyword(영문)
- 결과를 `output/{제목}_analyze.json`으로 저장

분석 결과를 사용자에게 보여주고, 수정할 부분이 있는지 확인한다.

### Step 2: 이미지 검색 (/card-image)

각 페이지의 `imageKeyword`로 Unsplash에서 배경 이미지를 검색한다.

- `.env.local`에서 `UNSPLASH_ACCESS_KEY`를 읽는다
- curl로 Unsplash API를 호출한다:
  ```bash
  curl -s "https://api.unsplash.com/search/photos?query={keyword}&per_page=3&orientation={orientation}&content_filter=high" \
    -H "Authorization: Client-ID {UNSPLASH_ACCESS_KEY}"
  ```
- 비율 매핑: `1:1`→`squarish`, `4:5`→`portrait`, `9:16`→`portrait`
- 각 페이지에 `imageUrl` 필드를 추가
- 결과 JSON 파일을 업데이트

### Step 3: .pen 파일 생성 (/card-publish)

분석 결과 + 이미지 URL을 pencil.dev `.pen` 포맷으로 조립한다.

캔버스 크기:
- `1:1`: 1080×1080
- `4:5`: 1080×1350
- `9:16`: 1080×1920

페이지당 레이어:
1. 배경 이미지 (cover, 전체 크기)
2. 오버레이 (`rgba(0,0,0,0.4)`)
3. 헤드라인 (72px bold white, y=height×0.38)
4. 서브텍스트 (36px, 있을 때만)

결과를 `output/{제목}.pen`으로 저장한다.

## 완료

최종 결과를 요약한다:
- 생성된 페이지 수
- 각 페이지의 headline과 배경 이미지 키워드
- .pen 파일 경로
- 편집이 필요하면 웹 UI(`npm run dev`)에서 열 수 있다고 안내
