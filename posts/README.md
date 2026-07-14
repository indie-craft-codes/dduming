# posts/ — 콘텐츠 데이터 계층

리팩터링 계획 1·4번을 현재 UI에 적용한 결과물입니다. `.dc.html`에 하드코딩돼 있던 글들을 계획서 스키마대로 JSON으로 떼어냈습니다.

## 파일

- `index.json` — 글 메타 목록(홈·카테고리 카드용). **빌드가 posts/*.json에서 자동 생성하는 파생물**(지금은 손 관리 샘플). 단일 소스는 각 post 파일.
- 새 글은 기존 post JSON을 복사해 내용만 교체.
- **전체 블록 타입 예시**는 `../docs/schema-example.json` 참고(14개 블록 타입 1:1, 발행 대상 아님).

## 핵심 원칙: 자동 파생이 기본, 수동은 optional override

손으로 두 번 쓰지 않는다. 아래는 빌드가 파생하며, 필드를 채우면 그 값으로 덮어쓴다(override).

| 파생 항목 | 소스 | override 방법 |
|--|--|--|
| `toc` | id 있는 `h2` 블록에서 자동 생성 + 자동 번호 | post에 `toc[]` 넣으면 그 문구 사용 |
| `index.json` | 각 post의 title·deck·date·cover·category·tags·featured | (파생물 — 직접 편집 금지) |
| `readingMinutes` | blocks 텍스트 길이 | post에 값 넣으면 override |
| `relatedPosts` | 같은 tags/category 자동 추천 | post에 slug 배열 넣으면 수동 지정 |

→ post 스키마에서 `toc`는 뺐다(자동). `readingMinutes`·`relatedPosts`는 필드만 두고 비워둠(자동 채움).

## blocks[] 타입 (현재 UI와 매핑)

| type | UI 블록 |
|--|--|
| `h2` / `h3` | 소제목 (H2는 목차 앵커) |
| `p` | 본문 문단 |
| `quote` | 인용 풀쿼트 |
| `chart` (`bar`/`line`/`donut`/`hbar`) | 그래프 4종 |
| `table` | 표 |
| `code` | 코드 블록 |
| `checklist` / `ol` / `ul` | 체크리스트·번호·불릿 목록 |
| `callout` | 콜아웃 |
| `gallery` | 이미지 갤러리(2단) |
| `video` | 영상 임베드 |
| `faq` | FAQ 아코디언 (native `<details>`, zero-JS) |
| `giftTaxCalc` | 증여세 계산기 (인터랙티브 컴포넌트/island). 옵션: `title`·`defaultAmount`·`presets` |

### 인터랙티브 컴포넌트

정적 블록 외에 JS가 필요한 위젯은 `build/components/`에 컴포넌트로 둔다. 각 컴포넌트 파일은 `render(props)`·`css`·`name`·`placement`를 export하고, `build/components/index.mjs` 레지스트리에 등록하면 블록 `type`으로 바로 쓸 수 있다.

- 사용: `{ "type": "giftTaxCalc" }` (props 생략 시 기본값). 여러 글에서 재사용 가능.
- `placement: 'top'`이면 커버 다음(요약 위)에 자동 배치.
- 인스턴스별 고유 id로 스코프 → 한 페이지에 여러 개 배치 가능.
- 새 위젯은 `components/`에 파일 하나 추가 + 레지스트리 한 줄.

## 커버 이미지 규칙

`coverImage` 필드 하나로 결정된다.

| 경우 | 동작 |
|--|--|
| `coverImage` 지정됨 (예: `"images/gift-tax.png"`) | 그 이미지를 그대로 사용 (프리미엄·직접 제작) |
| `coverImage` 없음 | 빌드가 **텍스트 커버 SVG 자동생성** → `dist/images/auto/{slug}.svg` |

- 자동 커버는 `title`·`category`·`deck`·`datePublished`에서 파생. 손댈 것 없음.
- 카테고리별로 뱃지 색·워터마크가 자동: 기술 `</>`(파랑) / 경제 `₩`(초록) / 부동산 `㎡`(주황).
- 무의존 SVG라 CI에서도 그대로 생성(래스터화 불필요). 소셜 OG용 고정 이미지가 필요한 글만 `coverImage`로 직접 지정.
- 로직: `build/cover.mjs` (`autoCoverSVG`).

## 발행 상태 · 본문 없는 글 처리

- `status: "published" | "draft"` — 목록 노출 여부를 이 필드로 판단.
- **index엔 있는데 본문(post 파일) 없는 글**: 빌드가 `status`로 판별 — `draft`면 목록에서 스킵(상세 페이지 미생성), `published`인데 본문 없으면 빌드 오류로 처리.

## 카테고리 → 뱃지 매핑

템플릿은 영문 뱃지를 쓰므로 빌드가 `category`를 매핑한다. 라벨·색은 `ui-guide.md` 컬러 시스템과 한 곳에서 관리:

| category | 뱃지 | 색 |
|--|--|--|
| 기술 | TECH | 포인트 컬러(파랑) |
| 경제 | ECONOMY | 초록 |
| 부동산 | REAL ESTATE | 주황 |

## 두 세계 (계획서와 동일)

- **작성/미리보기**: `.dc.html` + support.js — 이 디자인툴. JSON은 참고용.
- **프로덕션**: Claude Code 빌드(계획 7번)가 `posts/*.json`을 읽어 정적 HTML + island로 렌더. `.dc.html` 템플릿·테마를 재현 기준으로 사용.

→ 이 JSON 스키마가 나중 DB `posts` 테이블 + `post_blocks`(JSONB)로 그대로 승격됩니다.
