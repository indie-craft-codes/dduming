// 블록(type) → 정적 HTML. 차트=CSS/SVG, FAQ=native <details> → zero JS.
// 인터랙티브 블록은 build/components 레지스트리에 위임.
import { esc } from './util.mjs';
import { renderComponent } from './components/index.mjs';
import { renderChart } from './charts.mjs';
export { esc };

const cap = (t) => t ? `<div class="cap">${esc(t)}</div>` : '';

function table(b) {
  const cell = (c) => (c && typeof c === 'object' && c.href)
    ? `<a href="${esc(c.href)}">${esc(c.text)}</a>`
    : esc(c);
  const head = b.head ? `<thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : '';
  const rows = b.rows.map(r => `<tr>${r.map(c => `<td>${cell(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="tablewrap"><table>${head}<tbody>${rows}</tbody></table></div>${cap(b.caption)}`;
}

function faq(b) {
  return b.items.map(it =>
    `<details class="faq"><summary>${esc(it.q)}</summary><div class="ans">${esc(it.a)}</div></details>`).join('');
}

// 블록 하나 렌더
export function renderBlock(b) {
  const comp = renderComponent(b); // 등록된 인터랙티브 컴포넌트면 위임
  if (comp !== null) return comp;
  switch (b.type) {
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h2': return `<h2 id="${esc(b.id || '')}">${esc(b.text)}</h2>`;
    case 'h3': return `<h3>${esc(b.text)}</h3>`;
    case 'quote': return `<blockquote>${esc(b.text)}</blockquote>`;
    case 'callout': return `<div class="callout">${esc(b.text)}${b.href ? ` <a class="clink" href="${esc(b.href)}">${esc(b.linkText || '자세히 보기')}</a>` : ''}</div>`;
    case 'chart': return renderChart(b);
    case 'svg': return `<figure class="chart">${b.svg}${cap(b.caption)}</figure>`; // 인라인 SVG 인포그래픽(작성자 신뢰, raw)
    case 'table': return table(b);
    case 'code':
      return `<pre>${b.fileName ? `<span class="fn">${esc(b.fileName)}</span>` : ''}<code>${esc(b.code)}</code></pre>`;
    case 'ul': return `<ul class="blk">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol class="blk">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
    case 'checklist':
      return `<ul class="check">${b.items.map(i =>
        `<li><span class="box${i.checked ? ' on' : ''}">${i.checked ? '✓' : ''}</span><span>${esc(i.text)}</span></li>`).join('')}</ul>`;
    case 'gallery':
      return `<div class="gallery">${b.items.map(i =>
        `<div class="cell"><div class="ph"></div>${cap(i.caption)}</div>`).join('')}</div>`;
    case 'video':
      return `<div class="videobox">${esc(b.caption || 'VIDEO')}</div>`;
    case 'faq': return faq(b);
    default: return `<!-- unknown block: ${esc(b.type)} -->`;
  }
}
