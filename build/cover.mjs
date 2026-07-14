// 텍스트 기반 커버 자동생성 규칙.
// coverImage가 없는 글은 제목·카테고리·deck에서 SVG 커버를 만든다(무의존·CI 호환).
import { CATEGORIES, tokens } from './theme.mjs';
import { esc } from './blocks.mjs';

const W = 1200, H = 750, PAD = 88;

// 카테고리별 워터마크 글리프
const GLYPH = { '기술': '</>', '경제': '₩', '부동산': '㎡' };

// 제목을 최대 3줄로 줄바꿈(한글 기준 ~10자/줄)
function wrap(title, per = 10, maxLines = 3) {
  const words = String(title).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; }
    else if ((cur + ' ' + w).length <= per) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
    if (lines.length === maxLines - 1 && cur.length > per) {
      // 마지막 줄 넘치면 자르고 말줄임
      lines.push(cur.slice(0, per - 1) + '…'); cur = ''; break;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

const truncate = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : (s || ''));

export function autoCoverSVG(post) {
  const cat = CATEGORIES[post.category] || { badge: post.category || '', color: tokens.point };
  const lines = wrap(post.title, 10, 3);
  const glyph = GLYPH[post.category] || '·';

  const titleFS = 92, lineH = 104;
  const titleTop = H / 2 - ((lines.length - 1) * lineH) / 2 - 40;
  const titleSpans = lines.map((ln, i) =>
    `<text x="${PAD}" y="${titleTop + i * lineH}" font-size="${titleFS}" font-weight="700" fill="${tokens.ink}" letter-spacing="-2">${esc(ln)}</text>`
  ).join('');

  const ruleY = titleTop + (lines.length - 1) * lineH + 54;
  const sub = truncate(post.deck, 34);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  font-family="'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif">
  <defs>
    <radialGradient id="g" cx="100%" cy="0%" r="120%">
      <stop offset="0%" stop-color="${tokens.point}" stop-opacity="0.10"/>
      <stop offset="55%" stop-color="${tokens.point}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${tokens.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="${W - PAD + 40}" y="${H + 40}" font-size="360" font-weight="700" fill="${tokens.point}" fill-opacity="0.06" text-anchor="end">${esc(glyph)}</text>
  <rect x="${PAD}" y="${PAD}" width="${cat.badge.length * 15 + 32}" height="42" rx="6" fill="${cat.color}"/>
  <text x="${PAD + 16}" y="${PAD + 29}" font-size="20" font-weight="600" fill="#fff" letter-spacing="1">${esc(cat.badge)}</text>
  <text x="${W - PAD}" y="${PAD + 30}" font-size="26" font-weight="700" fill="${tokens.ink}" text-anchor="end">뚜밍<tspan fill="${tokens.point}">.</tspan></text>
  ${titleSpans}
  <rect x="${PAD}" y="${ruleY}" width="72" height="5" rx="3" fill="${tokens.point}"/>
  <text x="${PAD}" y="${ruleY + 52}" font-size="26" font-weight="500" fill="${tokens.sub}">${esc(sub)}</text>
  <text x="${PAD}" y="${H - PAD + 6}" font-size="18" fill="${tokens.sub}">${esc(post.category || '')} · ${esc(post.datePublished || '')}</text>
</svg>`;
}
