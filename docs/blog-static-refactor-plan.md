# 브리프 블로그 — 정적 단계 리팩터링 계획 (DB 대비)

> 작성일 2026-07-14 · 전제: **지금은 정적 HTML로 GitHub 배포만**. DB/WAS는 추후 연결.
> 목표: 지금 정적 단계에서 **"글=데이터" 구조**로 만들어 두면, 나중에 DB를 붙일 때 JSON 소스만 API/DB로 바꾸면 되도록.

---

## 핵심 원칙

**"콘텐츠(데이터) ↔ 템플릿(화면) ↔ 테마(스타일)"를 3분리.**
지금 이 셋이 각 `.dc.html` 안에 다 섞여 있음 → 글 1개 = 파일 1개 통째 복붙 구조. 이걸 풀어야 함.

DB를 안 붙여도, **파일 시스템(JSON/MD)을 "DB 대용"으로** 쓰면 스키마·주입 구조는 지금 완성 가능. 나중엔 소스만 교체.

### ⚠️ 런타임 확인 결과 (support.js 실측) — 이 계획의 전제

`support.js`를 뜯어본 결과, 이 키트의 실행 방식이 island과 정반대라 **7·8번의 접근을 바꿔야 함**:

- **전체 페이지 CSR**: `boot()`이 `<x-dc>`를 `dc.replaceWith(hostEl)`로 **통째로 버리고**, 빈 `<div id="dc-root">`에 `ReactDOM.createRoot().render()`로 전부 다시 그림 → **정적 HTML 폴백 없음**(JS 실패 시 백지)
- **support.js는 생성 파일**: 첫 줄에 `GENERATED ... do not edit` → **부분 하이드레이션을 여기 손으로 못 넣음**(재빌드 시 덮어써짐)
- **디자인툴 프리뷰 런타임임**: `sc-placeholder`·`sc-dc-streaming`·`markFetched`·`fetch(location.href)` → AI 생성물을 실시간 스트리밍 미리보기 하는 **편집기용**. 프로덕션 정적 호스팅 프레임워크가 아님

**함의**: `.dc.html` + support.js는 **"작성/미리보기 세계"**로만 쓰고, **프로덕션은 별도 빌드 산출물(7번)로 분리**한다. 즉 island은 support.js를 고쳐서가 아니라, 7번 빌드가 **support.js 없이 자체 정적 렌더 + island 부트스트랩을 emit**해서 달성한다. (아래 7·8번 참조)

---

## 1. [필수] Post 데이터 모델 정의

글의 스키마를 먼저 확정한다. 이게 나중에 그대로 DB 테이블 컬럼이 됨.

```jsonc
// posts/2026-07-14-seoul-mid-apt.json
{
  "slug": "seoul-mid-apt-10-vs-12",      // URL·PK 역할 (변하지 않게)
  "category": "부동산",                   // 전체/기술/경제/부동산
  "tags": ["아파트", "실거래", "서울"],
  "title": "서울 외곽 중형, 10억 vs 12억 어디가 더 올랐나",
  "deck": "한 문장 요약(60자 내외)",
  "answerBox": "40~50단어 핵심 요약",
  "datePublished": "2026-07-14",
  "dateModified": "2026-07-14",
  "readingMinutes": 6,
  "coverImage": "images/seoul-mid.jpg",
  "toc": [ { "id": "sec-tier", "label": "1. 티어 구분" } ],
  "blocks": [                             // 본문을 블록 배열로 (CMS의 핵심)
    { "type": "h2", "id": "sec-tier", "text": "티어 구분" },
    { "type": "p", "text": "..." },
    { "type": "chart", "chartType": "line", "data": [...], "caption": "..." },
    { "type": "table", "head": [...], "rows": [[...]] },
    { "type": "callout", "text": "..." },
    { "type": "faq", "items": [ { "q": "...", "a": "..." } ] }
  ]
}
```

- **`slug`은 불변 키**로 취급(파일명·URL·나중 DB PK 일치) → 링크 안 깨짐
- `blocks[]` 배열이 핵심: 본문을 "블록의 순서"로 표현 → 티스토리/네이버 에디터처럼 블록 추가·삭제·정렬 가능해짐
- 이 JSON 구조 = 나중 DB의 `posts` 테이블 + `post_blocks` 테이블(또는 JSONB 컬럼)로 1:1 승격

---

## 2. [필수] 템플릿 "껍데기화" (데이터 주입형) + 블록별 정적/island 경계

지금: `Blog Post - Minimal.dc.html`의 `<script>`에 글 내용이 하드코딩.
개선: 템플릿은 **빈 껍데기**, 글 데이터는 밖에서 주입.

- `renderVals()`에서 `this.props.post`(또는 fetch한 JSON)를 받아 렌더
- `blocks[]`를 순회하며 `type`에 따라 블록 컴포넌트 렌더 (h2/p/chart/table/callout/faq …)
- **블록 렌더러를 함수로 분리**: `renderBlock(block)` → switch(type)
- **블록 type이 곧 "정적 vs island" 경계**: `h2/p/table/callout` = 빌드 때 정적 HTML로 굽는다. `faq`(아코디언)·`chart`(인터랙션) = island로 남겨 클라이언트에서만 hydrate. → 8번과 직결

효과: 글 1000개여도 템플릿은 1개. 정적 단계엔 빌드 스크립트가 JSON마다 HTML 생성(7번), DB 단계엔 API가 JSON 공급.

---

## 3. [필수] 공용 테마/스타일 추출

지금: `ink/sub/line/blue` 색 토큰과 수십 개 `xxxStyle`을 7개 파일이 각자 재선언 → 톤 바꾸면 전부 수정.
개선: `theme.js` 하나로 추출.

```js
// theme.js  — 모든 .dc.html이 공유
export const tokens = { ink:'#18181b', sub:'#6b6b70', line:'rgba(24,24,27,.12)', blue:'#3b6ef5', ... };
export const styles = (m /*모바일 여부*/) => ({ pageStyle:{...}, h2Style:{...}, ... });
```

- 색·폰트·간격 규칙을 단일 소스로 → 디자인 변경 1곳 수정
- 헤더/푸터/네비 같은 **공통 컴포넌트도 별도 파일**로 빼서 각 페이지가 import

---

## 4. [필수] 목록/카테고리를 인덱스 데이터로

지금: 홈·카테고리 페이지의 카드들이 하드코딩.
개선: `posts/index.json`(글 메타 목록)을 만들어 홈·카테고리가 이걸 읽어 카드 생성.

```jsonc
// posts/index.json
[ { "slug": "...", "title": "...", "category": "부동산", "date": "...", "cover": "...", "deck": "..." } ]
```

- 새 글 = JSON 1개 추가 + index에 한 줄 추가 (빌드가 자동화하면 index도 자동 생성)
- 카테고리 필터·정렬·페이지네이션이 데이터 기반으로 동작 → DB의 `WHERE category=?`로 그대로 이어짐

---

## 5. [필수] 그래프 데이터 분리

지금: 막대/선/도넛 그래프의 수치가 템플릿 스타일 값에 박혀 있음(예: `height:'84%'`).
개선: 블록 데이터의 `data` 배열에서 받아 렌더. 실측치(예: realty 분석 결과)를 그대로 주입 가능.

- 렌더러가 `data`→ 막대 높이/SVG path 계산
- 부동산 글엔 우리 티어 지수·구별 표를 바로 연결 가능
- 차트는 인터랙션 유무로 갈림: 정적 SVG면 빌드 때 굽고, 툴팁·토글 등 인터랙션이 있으면 island(8번)

---

## 6. [권장] 라우팅·URL 규칙 확정

지금: `<a href="Blog Post - Minimal.dc.html">` 식 파일 하드링크.
개선: **slug 기반 경로 규칙**을 지금 정해둔다.

- 정적: `/posts/{slug}.html`, 목록 `/`, 카테고리 `/category/{name}.html`
- DB 단계에서 서버 라우팅으로 바꿔도 **URL이 동일**하게 유지 → SEO·외부링크 안 깨짐
- 파일 링크를 slug 기준으로 생성하도록 빌드에서 처리

---

## 7. [권장] 정적 빌드 스크립트 (정적+island) — support.js를 대체하는 프로덕션 경로

JSON → HTML을 뽑는 작은 빌드 단계(Node 스크립트 1개). **이게 프로덕션 렌더의 주체**(support.js는 작성/미리보기용으로만 남김).

- 입력: `posts/*.json` + 템플릿 + theme
- 출력: `dist/` 정적 HTML (GitHub Pages 배포 대상)
- **본문은 `renderToStaticMarkup`으로 정적 HTML로 굽는다** — JS가 없어도 글·표·콜아웃이 그대로 보임(SEO·속도 확보). support.js처럼 `<x-dc>`를 버리고 CSR하지 않는다
- **FAQ·차트 등 인터랙션 블록만 `<div data-island="faq" data-props='...'>` 마커로 남긴다** → 클라이언트에서 그 컨테이너만 부분 hydrate
- 이게 있으면: 글쓰기 = JSON 작성 → `npm run build` → push. **CMS의 발행 버튼과 동일한 동작**을 로컬에서 미리 구현하는 셈

---

## 8. [권장] 클라이언트 JS는 필요한 조각에만 주입 (island 하이드레이션)

`support.js`는 전체 페이지를 CSR하는 **생성·수정 금지 파일**이라 그대로는 island에 못 씀(위 "런타임 확인 결과" 참조). 따라서 **7번 빌드가 자체 부트스트랩을 emit**한다.

- 빌드(7번)가 **정적 HTML을 기본**으로 내보내고, 작은 하이드레이션 스크립트 + React/ReactDOM CDN은 **island 블록이 있는 페이지에만** 주입
- 하이드레이션 스크립트는 페이지 전체가 아니라 **`[data-island]` 컨테이너만 골라 mount**(부분 하이드레이션) — support.js의 전체-페이지 mount와 다름
- 버전 고정으로 배포 안정성 확보
- **되돌릴 수 없는 "전부 제로 JS"는 피한다**: FAQ·차트는 지금부터 island로 남겨두어야 나중 편집·DB 단계에서 그대로 확장 가능

---

## 우선순위 요약

| 순위 | 항목 | 이유 |
|--|--|--|
| ★★★ | 1. Post 스키마 정의 | 모든 것의 기준. DB 컬럼으로 직행 |
| ★★★ | 2. 템플릿 껍데기화 + 블록 island 경계 | 글=파일 복붙 지옥 탈출, 정적/island 분기점 확정 |
| ★★★ | 3. 테마 추출 | 중복 제거, 디자인 단일 소스 |
| ★★★ | 4. 목록 인덱스화 | 홈/카테고리 자동화 |
| ★★☆ | 5. 그래프 데이터 분리 | 실데이터 연결 |
| ★★☆ | 6. URL 규칙 | 나중에 링크 안 깨지게 |
| ★★☆ | 7. 빌드 스크립트 (정적+island) | 제로 JS 기본, support.js 대체하는 프로덕션 렌더 |
| ★★☆ | 8. JS를 필요한 조각에만 | 속도/SEO + 후속 확장성 둘 다 확보 |

> 참고: 7·8번은 원래 ★☆☆였으나, support.js가 프로덕션에 부적합함이 확인되어 **"별도 빌드가 사실상 필수"**로 격상됨.

---

## 두 세계 분리 (작성/미리보기 vs 프로덕션)

| | 작성·미리보기 | 프로덕션 (배포) |
|--|--|--|
| 렌더 주체 | `.dc.html` + `support.js` (전체 CSR, 스트리밍 미리보기) | 7번 빌드 (`renderToStaticMarkup` 정적 + island) |
| 산출물 | 디자인툴 캔버스 | `dist/` 정적 HTML + 최소 island JS |
| JS | 항상 React 전체 로드 | island 있는 페이지에만 부분 로드 |
| 용도 | 글·디자인 만들 때 | GitHub Pages 서빙 |

→ support.js를 건드리지 않고 그대로 두되, **배포물은 7번 빌드가 따로 만든다.**

---

## DB 붙일 때 뭐가 바뀌나 (미리보기)

지금 이 구조로 해두면, 나중 DB 연결 시 바뀌는 건 **딱 데이터 소스뿐**:

| 계층 | 정적 (지금) | DB 연결 후 |
|--|--|--|
| 콘텐츠 | `posts/*.json` 파일 | `posts` 테이블 / API |
| 템플릿(껍데기) | 그대로 | **그대로** |
| 테마 | 그대로 | **그대로** |
| 목록 | `index.json` | `SELECT ... WHERE category=?` |
| 렌더 | 빌드가 정적+island | SSR/SSG가 정적+island (동일 컴포넌트 재사용) |
| 발행 | `npm run build` | 관리자 화면 "발행" 버튼 |

→ **템플릿·테마·island 컴포넌트는 손 안 대고**, 콘텐츠 공급원(파일→DB)과 렌더 시점(빌드→요청)만 교체. 이게 지금 리팩터링의 목적.
