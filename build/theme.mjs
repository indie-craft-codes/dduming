// 디자인 토큰 + 공용 CSS (ui-guide.md 기준). support.js 미사용, 자체 정적 렌더.

export const tokens = {
  ink: '#18181b',
  sub: '#6b6b70',
  point: '#3b6ef5',
  bg: '#faf9f6',
  line: 'rgba(24,24,27,.12)',
  green: '#1a7a4c',
  orange: '#b5680c',
};

// 카테고리 → 뱃지 라벨·색·URL슬러그 (posts/README 매핑표)
export const CATEGORIES = {
  '경제':   { badge: 'ECONOMY',     color: tokens.green,  slug: 'economy' },
  '부동산': { badge: 'REAL ESTATE', color: tokens.orange, slug: 'realestate' },
};

export const SITE = {
  title: '뚜밍',
  brand: 'dduming',
  desc: '경제 · 부동산을 짧고 정확하게.',
  // canonical·OG·sitemap·RSS의 절대 URL 기준 (커스텀 도메인)
  baseUrl: 'https://dduming.com',
  // Cloudflare Web Analytics 비콘 토큰 (공개용, 페이지에 삽입됨)
  cfBeacon: '4b7b84be85354dffa7d600c414f679e0',
  // Google Search Console 소유권 확인 코드
  googleVerify: 'i0dzcQxZ5VX6GEwbE_HFdXqGN7M0dOZAHF0txHnY9tA',
  // 네이버 서치어드바이저 소유 확인 코드
  naverVerify: '1596dca8c265a24f545a67939a2437b24ab63ad0',
  // Google AdSense — 승인 신청 시 'ca-pub-XXXXXXXXXXXXXXXX' 입력(비우면 광고·스크립트·ads.txt 모두 비활성)
  adsenseClient: 'ca-pub-4977445987108311',
  // 승인 후 콘솔에서 만든 광고 유닛 슬롯 ID(숫자). 두 위치 모두 채워야 해당 위치에 광고 노출.
  adsenseSlots: { articleTop: '', articleBottom: '' },
};

export const css = `
:root{--ink:${tokens.ink};--sub:${tokens.sub};--point:${tokens.point};--bg:${tokens.bg};--line:${tokens.line};--green:${tokens.green};--orange:${tokens.orange}}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:'IBM Plex Sans KR',system-ui,sans-serif;color:var(--ink);background:color-mix(in srgb,var(--point) 4%,var(--bg));line-height:1.8;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:1240px;margin:0 auto;padding:0 56px}
/* header */
header.site{padding:28px 0 0}
.navrow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.logo{font-weight:700;font-size:22px;letter-spacing:-.02em}
.logo .dot{color:var(--point)}
nav.top{display:flex;gap:28px;font-size:14px}
nav.top a{color:var(--sub);font-weight:500}
nav.top a.active{color:var(--ink);font-weight:600}
.rule{height:1px;background:var(--line);margin-top:22px}
/* badges */
.badge{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.04em;padding:3px 9px;border-radius:4px;color:#fff}
/* cards */
main{padding:44px 0 40px}
.hero{margin-bottom:44px}
.hero>a{display:grid;grid-template-columns:1fr 1.15fr;gap:36px;align-items:center}
.hero .cover{aspect-ratio:16/10;background:color-mix(in srgb,var(--point) 8%,var(--line));border-radius:4px;overflow:hidden}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
.a-cover{border-radius:6px;overflow:hidden;margin:4px 0 8px}
.a-cover img{width:100%;display:block}
.card-title{font-weight:700;letter-spacing:-.01em;line-height:1.25;margin:12px 0 8px}
.hero .card-title{font-size:30px}
.deck{color:var(--sub);font-size:15.5px;margin:0}
.meta{color:var(--sub);font-size:13px;margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card .cover{aspect-ratio:16/10;background:color-mix(in srgb,var(--point) 8%,var(--line));border-radius:4px;overflow:hidden}
.card .card-title{font-size:18px}
.card .deck{font-size:14px}
.sec-head{font-size:14px;font-weight:600;color:var(--sub);letter-spacing:.02em;margin:0 0 18px;padding-bottom:10px;border-bottom:1px solid var(--line)}
/* article */
article{max-width:760px;margin:0 auto}
.a-head{display:flex;flex-direction:column;gap:12px;margin-bottom:30px}
h1.title{font-size:44px;font-weight:700;line-height:1.14;letter-spacing:-.01em;margin:4px 0 0}
.a-deck{font-size:17px;color:var(--sub);margin:0}
.answerbox{background:color-mix(in srgb,var(--point) 7%,transparent);border:1px solid color-mix(in srgb,var(--point) 25%,transparent);border-radius:6px;padding:20px 24px;margin:8px 0 4px}
.answerbox .lbl{font-size:12px;font-weight:600;color:var(--point);letter-spacing:.05em;margin-bottom:8px}
.answerbox p{margin:0;font-size:16px}
.toc{border:1px solid var(--line);border-radius:6px;padding:18px 22px;margin:24px 0}
.toc .lbl{font-size:13px;font-weight:600;color:var(--sub);margin-bottom:10px}
.toc a{display:block;color:var(--ink);font-size:14.5px;padding:4px 0}
.toc a:hover{color:var(--point)}
article h2{font-size:25px;font-weight:600;letter-spacing:-.01em;margin:44px 0 14px;scroll-margin-top:20px}
article h3{font-size:19px;font-weight:600;margin:28px 0 10px}
article p{font-size:17px;margin:0 0 18px}
blockquote{border-left:3px solid var(--point);margin:24px 0;padding:6px 0 6px 20px;font-size:19px;font-weight:500;color:var(--ink)}
.tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:18px 0}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
th{font-weight:600;color:var(--sub);font-size:13.5px;border-bottom:2px solid var(--line)}
td:not(:first-child),th:not(:first-child){text-align:right}
/* 표 안 링크는 명확히 클릭 가능하게 (전역 a 리셋 위에 덮어씀) */
td a{color:var(--point);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,var(--point) 45%,transparent)}
td a::after{content:'\\2197';font-size:11px;margin-left:2px;color:color-mix(in srgb,var(--point) 60%,transparent);vertical-align:1px}
td a:hover{text-decoration-color:var(--point)}
/* 넓은 표는 .tablewrap 안에서 좌우 스크롤 (모든 셀 nowrap) */
.cap{font-size:12.5px;color:var(--sub);margin:6px 0 22px}
.chart .cap{text-align:center;margin:14px 0 0}
pre{background:#1c1c20;color:#e8e8ea;border-radius:6px;padding:18px 20px;overflow-x:auto;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13.5px;line-height:1.7;margin:18px 0}
pre .fn{display:block;color:#9a9aa2;font-size:12px;margin-bottom:10px}
.callout{background:color-mix(in srgb,var(--point) 5%,transparent);border:1px solid var(--line);border-left:3px solid var(--point);border-radius:4px;padding:16px 20px;margin:22px 0;font-size:15.5px;color:var(--ink)}
.callout .clink{display:inline-block;margin-left:4px;color:var(--point);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-color:color-mix(in srgb,var(--point) 45%,transparent)}
.callout .clink::after{content:'\\2197';font-size:11px;margin-left:2px}
.callout .clink:hover{text-decoration-color:var(--point)}
ul.blk,ol.blk{margin:18px 0;padding-left:22px;font-size:16.5px}
ul.blk li,ol.blk li{margin:7px 0}
.check{list-style:none;padding:0;margin:18px 0}
.check li{display:flex;gap:10px;align-items:flex-start;margin:9px 0;font-size:16px}
.check .box{flex:none;width:18px;height:18px;border:1.5px solid var(--line);border-radius:4px;margin-top:3px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff}
.check .box.on{background:var(--point);border-color:var(--point)}
/* charts */
.chart{border:1px solid var(--line);border-radius:6px;padding:24px 28px 16px;margin:18px 0}
.bars{display:flex;align-items:flex-end;gap:20px;height:170px}
.bars .col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;height:100%}
.bars .bar{width:100%;background:color-mix(in srgb,var(--point) 25%,var(--line));border-radius:2px 2px 0 0}
.bars .bar.hl{background:var(--point)}
.bars .lab{font-size:12px;color:var(--sub)}
.bars .val{font-size:12px;font-weight:600}
.hbars{display:flex;flex-direction:column;gap:12px}
.hbars .row{display:grid;grid-template-columns:64px 1fr 48px;gap:10px;align-items:center;font-size:13px}
.hbars .track{height:14px;background:var(--line);border-radius:3px;overflow:hidden}
.hbars .fill{height:100%;background:var(--point)}
.donut{display:flex;align-items:center;gap:20px}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin:36px 0 0;padding-top:24px;border-top:1px solid var(--line)}
.tag{font-size:13px;color:var(--sub);background:color-mix(in srgb,var(--point) 8%,transparent);padding:5px 12px;border-radius:999px}
.pager{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin:44px 0 8px}
.pager a,.pager span{font-size:14px;line-height:1;padding:9px 13px;border:1px solid var(--line);border-radius:6px;color:var(--sub)}
.pager a:hover{border-color:var(--point);color:var(--point)}
.pager .pg-cur{background:var(--point);border-color:var(--point);color:#fff;font-weight:600}
.pager .pg-off{opacity:.4}
.pager .pg-nav{font-weight:500}
details.faq{border-bottom:1px solid var(--line);padding:2px 0}
details.faq summary{cursor:pointer;list-style:none;padding:14px 0;font-weight:600;font-size:16px;display:flex;justify-content:space-between;gap:12px}
details.faq summary::-webkit-details-marker{display:none}
details.faq summary::after{content:'+';color:var(--point);font-weight:600}
details.faq[open] summary::after{content:'−'}
details.faq .ans{padding:0 0 16px;color:var(--sub);font-size:15.5px}
footer.site{border-top:1px solid var(--line);margin-top:60px;padding:28px 0 48px;color:var(--sub);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
.gallery{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}
.gallery .cell .ph{aspect-ratio:4/3;background:color-mix(in srgb,var(--point) 8%,var(--line));border-radius:4px}
.videobox{aspect-ratio:16/9;background:color-mix(in srgb,var(--point) 8%,var(--line));border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--sub);font-size:13px;margin:18px 0}
@media(max-width:760px){
 .wrap{padding:0 20px}
 .hero>a{grid-template-columns:1fr;gap:14px}
 .grid{grid-template-columns:1fr}
 h1.title{font-size:28px}
 article h2{font-size:21px}
 nav.top{gap:14px;overflow-x:auto}
 table{font-size:13.5px}
 th,td{padding:8px 9px}
}
`;
