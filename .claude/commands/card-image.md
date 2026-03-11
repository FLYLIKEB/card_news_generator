# /card-image — Unsplash 배경 이미지 검색

카드뉴스 페이지에 사용할 배경 이미지를 Unsplash에서 검색합니다.

## 입력

- `$ARGUMENTS` : 검색 키워드 (영문) 또는 analyze 결과 JSON 파일 경로
- 옵션: `--ratio 1:1|4:5|9:16` (기본 1:1)

## 실행 절차

1. `$ARGUMENTS`가 JSON 파일 경로이면 파일을 읽고, 각 페이지의 `imageKeyword`로 검색한다
2. 키워드 문자열이면 해당 키워드로 단건 검색한다

### Unsplash API 호출

프로젝트 루트의 `.env.local`에서 `UNSPLASH_ACCESS_KEY`를 읽는다.

Bash로 curl을 실행하여 Unsplash API를 호출한다:

```bash
curl -s "https://api.unsplash.com/search/photos?query={keyword}&per_page=3&orientation={orientation}&content_filter=high" \
  -H "Authorization: Client-ID {UNSPLASH_ACCESS_KEY}"
```

비율 매핑:
- `1:1` → `squarish`
- `4:5` → `portrait`
- `9:16` → `portrait`

## 출력

검색 결과를 사용자에게 보여주고, 선택된 이미지 URL을 JSON에 추가한다.

각 이미지 결과:
```json
{
  "url": "photo.urls.regular",
  "thumb": "photo.urls.thumb",
  "alt": "photo.alt_description",
  "credit": {
    "name": "photo.user.name",
    "link": "photo.user.links.html"
  }
}
```

JSON 파일 입력인 경우, 각 페이지에 `imageUrl` 필드를 추가하여 파일을 업데이트한다.
