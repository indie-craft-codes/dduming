# dduming (뚜밍)

기술·경제·부동산 브리핑 블로그. **정적 HTML 우선, 나중에 DB/CMS로 확장**하는 구조.

🔗 라이브: https://indie-craft-codes.github.io/dduming/

## 폴더 구조

| 폴더 | 세계 | 용도 |
|--|--|--|
| `posts/` | **콘텐츠(단일 소스)** | 글 데이터(JSON). 각 `{slug}.json`이 원본, `index.json`은 빌드 파생물 |
| `build/` | 빌드(프로덕션 렌더) | `posts/*.json` → `dist/` 정적 HTML. `build.mjs`(오케스트레이터)·`theme.mjs`(토큰+CSS)·`blocks.mjs`(블록 렌더)·`cover.mjs`(커버 자동생성) |
| `images/` | 소스 이미지 | 직접 만든 커버 등. 빌드가 `dist/images`로 복사 |
| `dist/` | 배포물 | 빌드 산출물. GitHub Pages 서빙 대상 (git 미추적, CI가 생성) |
| `templates/` | 작성·미리보기(참고용) | 원본 `.dc.html` + `support.js`(디자인툴 런타임). 프로덕션은 안 씀 |
| `docs/` | 문서 | 리팩터링 계획·작성/UI 가이드·스키마 예시 |

## 두 세계

- **작성/미리보기**: `templates/*.dc.html` + `support.js` — 디자인툴에서 디자인 확인용(전체 CSR)
- **프로덕션**: `build/`가 `posts/*.json`을 읽어 `dist/`에 **정적 HTML** 렌더. 차트는 CSS/SVG, FAQ는 native `<details>` → **완전 zero-JS**

자세한 설계·근거: [`docs/blog-static-refactor-plan.md`](docs/blog-static-refactor-plan.md)

## 빌드가 자동 파생하는 것 (손으로 두 번 안 씀)

| 파생물 | 소스 |
|--|--|
| `toc` | id 있는 `h2` 블록 (자동 번호) |
| `readingMinutes` | 블록 텍스트 길이 |
| `index.json` | 각 post의 메타 |
| **커버 이미지** | `coverImage` 없으면 title·category·deck에서 SVG 자동생성 |
| **SEO** | canonical·OG/Twitter·`sitemap.xml`·`robots.txt`·`feed.xml`(RSS) — `theme.mjs`의 `baseUrl` 하나 기준 |

## 글 발행 (= CMS의 "발행 버튼")

1. `posts/새글.json` 작성 (`status: "published"`, `coverImage` 없으면 커버 자동)
2. `git push`
3. GitHub Actions가 `node build/build.mjs` → `dist/` Pages 배포 (약 40초)

로컬 미리보기: `node build/build.mjs && (cd dist && python3 -m http.server 8899)`

## 로드맵

- [x] 1. Post 데이터 모델 정의 (`posts/`)
- [x] 3. 공용 테마 추출 (`build/theme.mjs`)
- [x] 4. 목록 인덱스 (빌드 파생)
- [x] 7. 정적 빌드 스크립트 (`build/`)
- [x] 8. JS 최소화 — 차트 CSS/SVG + FAQ native `<details>`로 **zero-JS** 달성 (부분 하이드레이션 불필요)
- [x] SEO/GEO — Answer Box·JSON-LD·OG·canonical·sitemap·robots·RSS
- [x] 배포 — GitHub Actions(`.github/workflows/deploy.yml`) → Pages
- [ ] (선택) 자산 cache-busting (`style.[hash].css`)
- [ ] (추후) DB 연결 → `posts` 테이블 + `post_blocks(JSONB)`로 승격
- [ ] (추후) 관리자 CMS

## 배포 구성

- Pages 소스: **GitHub Actions** (`build_type: workflow`)
- 워크플로: `.github/workflows/deploy.yml` — push→build→`dist/` 배포
- 사이트: `https://indie-craft-codes.github.io/dduming/` (커스텀 도메인 시 `theme.mjs`의 `baseUrl`도 함께 변경)
