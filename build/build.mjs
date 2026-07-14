// dduming 정적 빌드: posts/*.json → dist/ (홈·글상세·카테고리). support.js 미사용, zero-JS.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { css, tokens, CATEGORIES, SITE } from './theme.mjs';
import { renderBlock, esc } from './blocks.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'posts');
const DIST = join(ROOT, 'dist');

// ---------- 로드 ----------
const postFiles = readdirSync(POSTS).filter(f => f.endsWith('.json') && f !== 'index.json');
const posts = postFiles.map(f => JSON.parse(readFileSync(join(POSTS, f), 'utf8')));
const published = posts.filter(p => p.status === 'published')
  .sort((a, b) => (b.datePublished || '').localeCompare(a.datePublished || ''));

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
function page({ title, desc, active, main, base = '', ldjson = '' }) {
  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/style.css">${ldjson}
</head><body>
<div class="wrap"><header class="site"><div class="navrow">
<a href="${base}index.html" class="logo">${SITE.title}<span class="dot">.</span></a>${nav(active).replaceAll('href="', `href="${base}`)}
</div><div class="rule"></div></header>
<main>${main}</main>
<footer class="site"><span>${SITE.title}. — ${esc(SITE.desc)}</span><span>© 2026 ${SITE.brand}</span></footer>
</div></body></html>`;
}

// ---------- 카드 ----------
function card(p, base = '', hero = false) {
  const cls = hero ? 'hero' : 'card';
  const cover = p.coverImage ? `<img src="${base}${p.coverImage}" alt="${esc(p.title)}">` : '';
  const inner = `<a href="${base}posts/${p.slug}.html">
<div class="cover">${cover}</div><div>${badge(p.category)}
<div class="card-title">${esc(p.title)}</div>
<p class="deck">${esc(p.deck)}</p>
<div class="meta"><span>${fmtDate(p.datePublished)}</span><span>·</span><span>${readingMinutes(p)}분 읽기</span></div>
</div></a>`;
  return hero ? `<div class="hero">${inner}</div>` : `<div class="card">${inner}</div>`;
}

// ---------- 홈 ----------
function buildHome() {
  const [head, ...rest] = published;
  const featured = published.find(p => p.featured) || head;
  const others = published.filter(p => p.slug !== featured.slug);
  const main = card(featured, '', true)
    + (others.length ? `<div class="sec-head">최신 글</div><div class="grid">${others.map(p => card(p)).join('')}</div>` : '');
  writeFileSync(join(DIST, 'index.html'), page({
    title: `${SITE.title} · ${SITE.brand}`, desc: SITE.desc, active: 'all', main,
  }));
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
  const cover = p.coverImage ? `<figure class="a-cover"><img src="../${p.coverImage}" alt="${esc(p.title)}">${p.coverCaption ? `<figcaption class="cap">${esc(p.coverCaption)}</figcaption>` : ''}</figure>` : '';
  const answer = p.answerBox ? `<div class="answerbox"><div class="lbl">핵심 요약</div><p>${esc(p.answerBox)}</p></div>` : '';
  const tocHtml = toc.length ? `<div class="toc"><div class="lbl">목차</div>${toc.map(t => `<a href="#${esc(t.id)}">${esc(t.label)}</a>`).join('')}</div>` : '';
  const body = (p.blocks || []).map(renderBlock).join('\n');
  const tags = p.tags?.length ? `<div class="tags">${p.tags.map(t => `<span class="tag"># ${esc(t)}</span>`).join('')}</div>` : '';
  const related = rel.length ? `<div class="sec-head" style="margin-top:48px">관련 글</div><div class="grid">${rel.map(q => card(q, '../')).join('')}</div>` : '';
  const main = `<article><div class="a-head">${badge(p.category)}
<h1 class="title">${esc(p.title)}</h1><p class="a-deck">${esc(p.deck)}</p>
<div class="meta"><span>${fmtDate(p.datePublished)}</span><span>·</span><span>수정 ${fmtDate(p.dateModified || p.datePublished)}</span><span>·</span><span>${mins}분 읽기</span></div></div>
${cover}${answer}${tocHtml}${body}${tags}${related}</article>`;
  writeFileSync(join(DIST, 'posts', `${p.slug}.html`), page({
    title: `${p.title} · ${SITE.title}`, desc: p.deck, active: p.category, main, base: '../', ldjson,
  }));
}

// ---------- 카테고리 ----------
function buildCategory(catName) {
  const list = published.filter(p => p.category === catName);
  const main = `<div class="sec-head">${esc(catName)} · ${list.length}건</div>`
    + (list.length ? `<div class="grid">${list.map(p => card(p, '../')).join('')}</div>` : '<p>준비 중인 카테고리입니다.</p>');
  writeFileSync(join(DIST, 'category', `${catSlug(catName)}.html`), page({
    title: `${catName} · ${SITE.title}`, desc: `${catName} 카테고리 글 목록`, active: catName, main, base: '../',
  }));
}

// ---------- About ----------
function buildAbout() {
  const main = `<article><h1 class="title">소개</h1>
<p class="a-deck">${esc(SITE.desc)}</p>
<p>${SITE.title}(${SITE.brand})은 기술·경제·부동산 이슈를 짧고 정확하게 정리하는 브리핑 블로그입니다. 데이터와 출처를 근거로, 결론을 먼저 전합니다.</p></article>`;
  writeFileSync(join(DIST, 'about.html'), page({ title: `소개 · ${SITE.title}`, desc: SITE.desc, active: 'about', main }));
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
writeFileSync(join(DIST, 'assets', 'style.css'), css);
if (existsSync(join(ROOT, 'images'))) cpSync(join(ROOT, 'images'), join(DIST, 'images'), { recursive: true });

buildHome();
published.forEach(buildPost);
Object.keys(CATEGORIES).forEach(buildCategory);
buildAbout();
rebuildIndex();

console.log(`✓ build 완료 — published ${published.length}건 (draft ${posts.length - published.length} 스킵)`);
console.log(`  홈 + 글 ${published.length} + 카테고리 ${Object.keys(CATEGORIES).length} + about + index.json`);
published.forEach(p => console.log(`  · posts/${p.slug}.html  (${readingMinutes(p)}분, toc ${deriveToc(p).length})`));
