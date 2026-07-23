// dduming 정적 빌드: posts/*.json → dist/ (홈·글상세·카테고리). support.js 미사용, zero-JS.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { css, tokens, CATEGORIES, SITE } from './theme.mjs';
import { renderBlock, esc } from './blocks.mjs';
import { autoCoverSVG } from './cover.mjs';
import { componentsCss, topComponents } from './components/index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'posts');
const DIST = join(ROOT, 'dist');

// ---------- 로드 ----------
const postFiles = readdirSync(POSTS).filter(f => f.endsWith('.json') && f !== 'index.json');
const posts = postFiles.map(f => JSON.parse(readFileSync(join(POSTS, f), 'utf8')));
// publishedAt 자동 스탬프: 없으면 현재 시각으로 채워 원본 파일에 기록(최초 1회) → 최신순 안정화
posts.forEach((p, i) => {
  if (!p.publishedAt) {
    p.publishedAt = new Date().toISOString();
    writeFileSync(join(POSTS, postFiles[i]), JSON.stringify(p, null, 2) + '\n');
    console.log(`  + publishedAt 자동 스탬프: ${p.slug} → ${p.publishedAt}`);
  }
});
const published = posts.filter(p => p.status === 'published')
  .sort((a, b) => (b.publishedAt || b.datePublished || '').localeCompare(a.publishedAt || a.datePublished || ''));

// 정적 페이지 (소개·개인정보처리방침·연락처 등)
const PAGES = join(ROOT, 'pages');
const staticPages = existsSync(PAGES)
  ? readdirSync(PAGES).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(PAGES, f), 'utf8')))
  : [];

// index.json에는 있으나 본문 없는 published 슬러그 = 빌드 오류(README 규칙)
const idxRaw = existsSync(join(POSTS, 'index.json')) ? JSON.parse(readFileSync(join(POSTS, 'index.json'), 'utf8')) : [];
const haveSlugs = new Set(posts.map(p => p.slug));
for (const e of idxRaw) {
  if (e.status === 'published' && !haveSlugs.has(e.slug))
    throw new Error(`[build] index에 published지만 본문 없음: ${e.slug}`);
}

// ---------- 자동 파생 ----------
const fmtDate = (d) => (d || '').replaceAll('-', '.');
function readingMinutes(p) {
  if (p.readingMinutes) return p.readingMinutes;            // override
  const chars = (p.blocks || []).reduce((n, b) =>
    n + (b.text?.length || 0) + (b.items?.reduce?.((m, i) => m + (i.q?.length || 0) + (i.a?.length || 0) + (typeof i === 'string' ? i.length : i.text?.length || 0), 0) || 0), 0);
  return Math.max(1, Math.round(chars / 500));               // 한글 ~500자/분
}
function deriveToc(p) {
  if (p.toc) return p.toc;                                   // override
  let n = 0;
  return (p.blocks || []).filter(b => b.type === 'h2' && b.id)
    .map(b => ({ id: b.id, label: `${++n}. ${b.text}` }));
}
function relatedOf(p) {
  const slugs = p.relatedPosts?.length ? p.relatedPosts
    : published.filter(q => q.slug !== p.slug && q.category === p.category).slice(0, 3).map(q => q.slug);
  return slugs.map(s => published.find(q => q.slug === s)).filter(Boolean);
}
// 공용 CSS + 컴포넌트 CSS 합본. 캐시 버스팅: 내용 해시를 파일명에 박음
const fullCss = css + componentsCss;
const cssFile = `assets/style.${createHash('sha1').update(fullCss).digest('hex').slice(0, 8)}.css`;
// 커버 규칙: coverImage 있으면 사용, 없으면 자동 SVG 커버 경로
const coverSrc = (p) => p.coverImage || `images/auto/${p.slug}.svg`;
const badge = (catName) => {
  const c = CATEGORIES[catName]; if (!c) return '';
  return `<span class="badge" style="background:${c.color}">${c.badge}</span>`;
};
const catSlug = (catName) => CATEGORIES[catName]?.slug || 'etc';

// ---------- 공통 셸 ----------
function nav(active) {
  const link = (label, href, key) =>
    `<a href="${href}"${active === key ? ' class="active"' : ''}>${label}</a>`;
  return `<nav class="top">`
    + link('전체', 'index.html', 'all')
    + Object.keys(CATEGORIES).map(c => link(c, `category/${catSlug(c)}.html`, c)).join('')
    + link('소개', 'about.html', 'about')
    + `</nav>`;
}
const abs = (path) => `${SITE.baseUrl}/${path}`.replace(/\/$/, '/') ;
function page({ title, desc, active, main, base = '', ldjson = '', path = 'index.html', ogType = 'website', image = '' }) {
  const canonical = path === 'index.html' ? `${SITE.baseUrl}/` : abs(path);
  const ogImage = image ? abs(image) : '';
  const og = [
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="${esc(SITE.title)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${canonical}">`,
    ogImage ? `<meta property="og:image" content="${ogImage}">` : '',
    `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    ogImage ? `<meta name="twitter:image" content="${ogImage}">` : '',
  ].filter(Boolean).join('\n');
  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}html,body{margin:0}body{background:color-mix(in srgb,${tokens.point} 4%,${tokens.bg});color:${tokens.ink};font-family:'IBM Plex Sans KR',system-ui,sans-serif;line-height:1.8}</style>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${SITE.googleVerify ? `<meta name="google-site-verification" content="${SITE.googleVerify}">` : ''}
${SITE.naverVerify ? `<meta name="naver-site-verification" content="${SITE.naverVerify}">` : ''}
${SITE.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}" crossorigin="anonymous"></script>` : ''}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-96.png" sizes="96x96" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#3b6ef5">
${og}
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)}" href="${SITE.baseUrl}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}${cssFile}">${ldjson}
</head><body>
<div class="wrap"><header class="site"><div class="navrow">
<a href="${base}index.html" class="logo">${SITE.title}<span class="dot">.</span></a>${nav(active).replaceAll('href="', `href="${base}`)}
</div><div class="rule"></div></header>
<main>${main}</main>
<footer class="site"><span><a href="${base}about.html">소개</a> · <a href="${base}privacy.html">개인정보처리방침</a> · <a href="${base}contact.html">연락처</a></span><span>© 2026 ${SITE.brand}</span></footer>
</div>${SITE.cfBeacon ? `\n<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${SITE.cfBeacon}"}'></script>` : ''}
</body></html>`;
}

// ---------- 카드 ----------
function card(p, base = '', hero = false) {
  const cls = hero ? 'hero' : 'card';
  const cover = `<img src="${base}${coverSrc(p)}" alt="${esc(p.title)}">`;
  const inner = `<a href="${base}posts/${p.slug}.html">
<div class="cover">${cover}</div><div>${badge(p.category)}
<div class="card-title">${esc(p.title)}</div>
<p class="deck">${esc(p.deck)}</p>
<div class="meta"><span>${fmtDate(p.datePublished)}</span><span>·</span><span>${readingMinutes(p)}분 읽기</span></div>
</div></a>`;
  return hero ? `<div class="hero">${inner}</div>` : `<div class="card">${inner}</div>`;
}

// ---------- 페이징 ----------
const PAGE_SIZE = 12;
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out.length ? out : [[]]; };
function pager(cur, total, urlFor) {
  if (total <= 1) return '';
  const nums = [];
  for (let n = 1; n <= total; n++) nums.push(n === cur
    ? `<span class="pg-n pg-cur" aria-current="page">${n}</span>`
    : `<a class="pg-n" href="${urlFor(n)}">${n}</a>`);
  const prev = cur > 1 ? `<a class="pg-nav" href="${urlFor(cur - 1)}" rel="prev">← 이전</a>` : `<span class="pg-nav pg-off">← 이전</span>`;
  const next = cur < total ? `<a class="pg-nav" href="${urlFor(cur + 1)}" rel="next">다음 →</a>` : `<span class="pg-nav pg-off">다음 →</span>`;
  return `<nav class="pager" aria-label="페이지 이동">${prev}${nums.join('')}${next}</nav>`;
}

// ---------- 홈 ----------
function buildHome() {
  const featured = published.find(p => p.featured) || published[0];
  const others = published.filter(p => p.slug !== featured.slug);
  const pages = chunk(others, PAGE_SIZE);
  const total = pages.length;
  const urlFor = n => n === 1 ? '/' : `/page/${n}.html`;
  pages.forEach((items, i) => {
    const n = i + 1, base = n === 1 ? '' : '../';
    const label = n === 1 ? '최신 글' : `전체 글 · ${n}페이지`;
    const grid = items.length ? `<div class="sec-head">${label}</div><div class="grid">${items.map(p => card(p, base)).join('')}</div>` : '';
    const main = (n === 1 ? card(featured, '', true) : '') + grid + pager(n, total, urlFor);
    if (n > 1) mkdirSync(join(DIST, 'page'), { recursive: true });
    writeFileSync(n === 1 ? join(DIST, 'index.html') : join(DIST, 'page', `${n}.html`), page({
      title: n === 1 ? `${SITE.title} · ${SITE.brand}` : `전체 글 ${n}페이지 · ${SITE.title}`,
      desc: SITE.desc, active: 'all', main, base,
      path: n === 1 ? 'index.html' : `page/${n}.html`, ogType: 'website', image: coverSrc(featured),
    }));
  });
}

// ---------- 글 상세 ----------
function buildPost(p) {
  const toc = deriveToc(p), mins = readingMinutes(p), rel = relatedOf(p);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.deck,
    datePublished: p.datePublished, dateModified: p.dateModified || p.datePublished,
    author: { '@type': 'Organization', name: SITE.brand }, publisher: { '@type': 'Organization', name: SITE.brand },
    articleSection: p.category, keywords: p.tags, inLanguage: 'ko-KR',
  };
  const ldjson = `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  // 커버는 카드 썸네일·OG용으로만 사용. 본문에는 제목이 H1과 중복돼 표시하지 않음.
  const answer = p.answerBox ? `<div class="answerbox"><div class="lbl">핵심 요약</div><p>${esc(p.answerBox)}</p></div>` : '';
  const tocHtml = toc.length ? `<div class="toc"><div class="lbl">목차</div>${toc.map(t => `<a href="#${esc(t.id)}">${esc(t.label)}</a>`).join('')}</div>` : '';
  // 상단 고정 컴포넌트(placement:'top')는 맨 위(커버 다음)로, 나머지는 본문 흐름에
  const topHtml = (p.blocks || []).filter(b => topComponents.has(b.type)).map(renderBlock).join('\n');
  const body = (p.blocks || []).filter(b => !topComponents.has(b.type)).map(renderBlock).join('\n');
  const tags = p.tags?.length ? `<div class="tags">${p.tags.map(t => `<span class="tag"># ${esc(t)}</span>`).join('')}</div>` : '';
  const related = rel.length ? `<div class="sec-head" style="margin-top:48px">관련 글</div><div class="grid">${rel.map(q => card(q, '../')).join('')}</div>` : '';
  // 광고(수동·공간예약형). SITE.adsenseClient + 슬롯 미설정이면 빈 문자열 → 노출 없음.
  const adTop = renderBlock({ type: 'adSlot', pos: 'articleTop' });
  const adBottom = renderBlock({ type: 'adSlot', pos: 'articleBottom' });
  const main = `<article><div class="a-head">${badge(p.category)}
<h1 class="title">${esc(p.title)}</h1><p class="a-deck">${esc(p.deck)}</p>
<div class="meta"><span>${fmtDate(p.datePublished)}</span><span>·</span><span>수정 ${fmtDate(p.dateModified || p.datePublished)}</span><span>·</span><span>${mins}분 읽기</span></div></div>
${topHtml}${answer}${adTop}${tocHtml}${body}${adBottom}${tags}${related}</article>`;
  writeFileSync(join(DIST, 'posts', `${p.slug}.html`), page({
    title: `${p.title} · ${SITE.title}`, desc: p.deck, active: p.category, main, base: '../', ldjson,
    path: `posts/${p.slug}.html`, ogType: 'article', image: coverSrc(p),
  }));
}

// ---------- 카테고리 ----------
function buildCategory(catName) {
  const list = published.filter(p => p.category === catName);
  const slug = catSlug(catName);
  const pages = chunk(list, PAGE_SIZE);
  const total = pages.length;
  const urlFor = n => n === 1 ? `/category/${slug}.html` : `/category/${slug}/${n}.html`;
  pages.forEach((items, i) => {
    const n = i + 1, base = n === 1 ? '../' : '../../';
    const head = `<div class="sec-head">${esc(catName)} · ${list.length}건${total > 1 ? ` (${n}/${total})` : ''}</div>`;
    const grid = items.length ? `<div class="grid">${items.map(p => card(p, base)).join('')}</div>` : '<p>준비 중인 카테고리입니다.</p>';
    const main = head + grid + pager(n, total, urlFor);
    if (n > 1) mkdirSync(join(DIST, 'category', slug), { recursive: true });
    writeFileSync(n === 1 ? join(DIST, 'category', `${slug}.html`) : join(DIST, 'category', slug, `${n}.html`), page({
      title: `${catName}${n > 1 ? ` · ${n}페이지` : ''} · ${SITE.title}`, desc: `${catName} 카테고리 글 목록`,
      active: catName, main, base, path: n === 1 ? `category/${slug}.html` : `category/${slug}/${n}.html`, ogType: 'website',
    }));
  });
}

// ---------- 정적 페이지 (소개·개인정보처리방침·연락처 등) ----------
function buildStaticPage(p) {
  const body = (p.blocks || []).map(renderBlock).join('\n');
  const main = `<article><div class="a-head"><h1 class="title">${esc(p.title)}</h1></div>${body}</article>`;
  writeFileSync(join(DIST, `${p.slug}.html`), page({
    title: `${p.title} · ${SITE.title}`, desc: p.description || SITE.desc,
    active: p.slug === 'about' ? 'about' : '', main, path: `${p.slug}.html`, ogType: 'website',
  }));
}

// ---------- sitemap.xml (published + 목록 페이지) ----------
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const homePages = Math.max(1, Math.ceil((published.length - 1) / PAGE_SIZE));
  const homeExtra = Array.from({ length: homePages - 1 }, (_, i) => ({ loc: abs(`page/${i + 2}.html`), lastmod: today }));
  const catExtra = Object.keys(CATEGORIES).flatMap(c => {
    const n = Math.ceil(published.filter(p => p.category === c).length / PAGE_SIZE);
    return Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ loc: abs(`category/${catSlug(c)}/${i + 2}.html`), lastmod: today }));
  });
  const urls = [
    { loc: `${SITE.baseUrl}/`, lastmod: published[0]?.dateModified || today },
    ...homeExtra,
    ...staticPages.map(p => ({ loc: abs(`${p.slug}.html`), lastmod: today })),
    ...Object.keys(CATEGORIES).map(c => ({ loc: abs(`category/${catSlug(c)}.html`), lastmod: today })),
    ...catExtra,
    ...published.map(p => ({ loc: abs(`posts/${p.slug}.html`), lastmod: p.dateModified || p.datePublished })),
  ];
  const body = urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n');
  writeFileSync(join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
}

// ---------- robots.txt ----------
function buildRobots() {
  writeFileSync(join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}/sitemap.xml\n`);
}

// ---------- RSS (feed.xml) ----------
function rfc822(d) { return new Date(`${d}T09:00:00+09:00`).toUTCString(); }
function buildFeed() {
  const items = published.map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${abs(`posts/${p.slug}.html`)}</link>
      <guid isPermaLink="true">${abs(`posts/${p.slug}.html`)}</guid>
      <description>${esc(p.deck)}</description>
      <category>${esc(p.category)}</category>
      <pubDate>${rfc822(p.datePublished)}</pubDate>
    </item>`).join('\n');
  writeFileSync(join(DIST, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>${esc(SITE.title)}</title>
    <link>${SITE.baseUrl}/</link>
    <description>${esc(SITE.desc)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${published[0] ? rfc822(published[0].datePublished) : new Date().toUTCString()}</lastBuildDate>
${items}
</channel></rss>\n`);
}

// ---------- index.json 재생성(파생물) ----------
function rebuildIndex() {
  const derived = published.map(p => ({
    slug: p.slug, category: p.category, status: p.status, featured: !!p.featured,
    tags: p.tags, title: p.title, deck: p.deck,
    datePublished: p.datePublished, dateModified: p.dateModified || p.datePublished,
    coverImage: p.coverImage, readingMinutes: readingMinutes(p),
  }));
  writeFileSync(join(DIST, 'index.json'), JSON.stringify(derived, null, 2));
}

// ---------- 실행 ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'posts'), { recursive: true });
mkdirSync(join(DIST, 'category'), { recursive: true });
mkdirSync(join(DIST, 'assets'), { recursive: true });
writeFileSync(join(DIST, cssFile), fullCss);
writeFileSync(join(DIST, 'CNAME'), 'dduming.com\n'); // GitHub Pages 커스텀 도메인
if (SITE.adsenseClient) { // AdSense ads.txt (pub-XXXX 형식)
  const pub = SITE.adsenseClient.replace(/^ca-/, '');
  writeFileSync(join(DIST, 'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
}
// 파비콘/앱아이콘을 사이트 루트로 복사
for (const f of ['favicon.ico', 'favicon.svg', 'favicon-96.png', 'apple-touch-icon.png', 'icon-512.png']) {
  const src = join(ROOT, 'images', f);
  if (existsSync(src)) cpSync(src, join(DIST, f));
}
if (existsSync(join(ROOT, 'images'))) cpSync(join(ROOT, 'images'), join(DIST, 'images'), { recursive: true });
// 커버 규칙: coverImage 없는 글은 텍스트 커버 SVG 자동생성
mkdirSync(join(DIST, 'images', 'auto'), { recursive: true });
let autoN = 0;
for (const p of published) {
  if (!p.coverImage) { writeFileSync(join(DIST, 'images', 'auto', `${p.slug}.svg`), autoCoverSVG(p)); autoN++; }
}

buildHome();
published.forEach(buildPost);
Object.keys(CATEGORIES).forEach(buildCategory);
staticPages.forEach(buildStaticPage);
rebuildIndex();
buildSitemap();
buildRobots();
buildFeed();

console.log(`✓ build 완료 — published ${published.length}건 (draft ${posts.length - published.length} 스킵)`);
console.log(`  홈 + 글 ${published.length} + 카테고리 ${Object.keys(CATEGORIES).length} + about + index.json`);
console.log(`  SEO: sitemap.xml · robots.txt · feed.xml · canonical/OG (baseUrl=${SITE.baseUrl})`);
published.forEach(p => console.log(`  · posts/${p.slug}.html  (${readingMinutes(p)}분, toc ${deriveToc(p).length})`));
