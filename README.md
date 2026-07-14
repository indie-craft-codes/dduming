# dduming (뚜밍)

기술·경제·부동산 브리핑 블로그. **정적 HTML 우선, 나중에 DB/CMS로 확장**하는 구조.

## 폴더 구조

| 폴더 | 세계 | 용도 |
|--|--|--|
| `posts/` | **콘텐츠(단일 소스)** | 글 데이터(JSON). `index.json`은 빌드 파생물, 각 `{slug}.json`이 원본 |
| `templates/` | **작성·미리보기** | 원본 `.dc.html` + `support.js`(디자인툴 런타임). 손대지 않음 |
| `theme/` | 공용 스타일 | 색·타이포·간격 토큰, 공통 컴포넌트 (계획 3번, 예정) |
| `build/` | 빌드 | `posts/*.json` → 정적 HTML + island 렌더 스크립트 (계획 7번, 예정) |
| `dist/` | 배포물 | 빌드 산출물. GitHub Pages 서빙 대상 (git 미추적) |
| `docs/` | 문서 | 리팩터링 계획·작성 가이드·UI 가이드 |

## 두 세계

- **작성/미리보기**: `templates/*.dc.html` + `support.js` — 디자인툴에서 글·디자인 확인용(전체 CSR)
- **프로덕션**: `build/`가 `posts/*.json`을 읽어 `dist/`에 **정적 HTML + 필요한 조각만 island** 렌더

자세한 설계·근거: [`docs/blog-static-refactor-plan.md`](docs/blog-static-refactor-plan.md)

## 로드맵

- [x] 1. Post 데이터 모델 정의 (`posts/`)
- [x] 4. 목록 인덱스 (`posts/index.json`, 빌드 파생 규칙 확정)
- [ ] 3. 공용 theme 추출 (`theme/`)
- [ ] 7. 정적+island 빌드 스크립트 (`build/`)
- [ ] 8. 부분 하이드레이션 부트스트랩
- [ ] (추후) DB 연결 → `posts` 테이블 + `post_blocks(JSONB)`로 승격
- [ ] (추후) 관리자 CMS

## 배포

`dist/`를 GitHub Pages로 서빙. 사이트 주소: `{아이디}.github.io/dduming` (커스텀 도메인 시 덮어씀).
