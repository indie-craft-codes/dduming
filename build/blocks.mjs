// 블록(type) → 정적 HTML. 차트=CSS/SVG, FAQ=native <details> → zero JS.

export const esc = (s = '') => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const cap = (t) => t ? `<div class="cap">${esc(t)}</div>` : '';

function bar(b) {
  const max = Math.max(...b.data.map(d => d.value)) || 1;
  const cols = b.data.map((d, i) => {
    const hl = b.highlightLast && i === b.data.length - 1 ? ' hl' : '';
    const h = Math.max(4, Math.round(d.value / max * 100));
    return `<div class="col"><span class="val">${esc(String(d.value))}</span>`
      + `<div class="bar${hl}" style="height:${h}%"></div>`
      + `<span class="lab">${esc(d.label)}</span></div>`;
  }).join('');
  return `<div class="bars">${cols}</div>`;
}

function hbar(b) {
  const max = Math.max(...b.data.map(d => d.value)) || 1;
  const rows = b.data.map(d =>
    `<div class="row"><span>${esc(d.label)}</span>`
    + `<div class="track"><div class="fill" style="width:${Math.round(d.value / max * 100)}%"></div></div>`
    + `<span style="text-align:right">${esc(String(d.value))}</span></div>`).join('');
  return `<div class="hbars">${rows}</div>`;
}

function line(b) {
  const vals = b.data.map(d => d.value);
  const max = Math.max(...vals), min = Math.min(...vals), span = (max - min) || 1;
  const W = 480, H = 140, pad = 10;
  const pts = b.data.map((d, i) => {
    const x = pad + i * (W - 2 * pad) / (b.data.length - 1 || 1);
    const y = H - pad - (d.value - min) / span * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const dots = pts.map(p => { const [x, y] = p.split(','); return `<circle cx="${x}" cy="${y}" r="3" fill="var(--point)"/>`; }).join('');
  const labs = b.data.map((d, i) => {
    const x = pad + i * (W - 2 * pad) / (b.data.length - 1 || 1);
    return `<text x="${x.toFixed(1)}" y="${H - 1}" font-size="10" fill="var(--sub)" text-anchor="middle">${esc(d.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H + 6}" style="width:100%;height:auto">`
    + `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--point)" stroke-width="2"/>${dots}${labs}</svg>`;
}

function donut(b) {
  const v = b.value ?? 0, r = 52, c = 2 * Math.PI * r;
  const on = c * v / 100;
  return `<div class="donut"><svg width="120" height="120" viewBox="0 0 120 120">`
    + `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--line)" stroke-width="16"/>`
    + `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--point)" stroke-width="16"`
    + ` stroke-dasharray="${on.toFixed(1)} ${(c - on).toFixed(1)}" stroke-linecap="round" transform="rotate(-90 60 60)"/>`
    + `<text x="60" y="66" font-size="22" font-weight="600" fill="var(--ink)" text-anchor="middle">${v}%</text></svg></div>`;
}

function chart(b) {
  const body = b.chartType === 'line' ? line(b)
    : b.chartType === 'donut' ? donut(b)
    : b.chartType === 'hbar' ? hbar(b)
    : bar(b);
  return `<div class="chart">${body}${cap(b.caption)}</div>`;
}

function table(b) {
  const head = b.head ? `<thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : '';
  const rows = b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="tablewrap"><table>${head}<tbody>${rows}</tbody></table></div>${cap(b.caption)}`;
}

function faq(b) {
  return b.items.map(it =>
    `<details class="faq"><summary>${esc(it.q)}</summary><div class="ans">${esc(it.a)}</div></details>`).join('');
}

// 블록 하나 렌더
export function renderBlock(b) {
  switch (b.type) {
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h2': return `<h2 id="${esc(b.id || '')}">${esc(b.text)}</h2>`;
    case 'h3': return `<h3>${esc(b.text)}</h3>`;
    case 'quote': return `<blockquote>${esc(b.text)}</blockquote>`;
    case 'callout': return `<div class="callout">${esc(b.text)}</div>`;
    case 'chart': return chart(b);
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
