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

// 증여세 간편 계산기 (인터랙티브 island — vanilla JS)
export function renderGiftTaxCalc() {
  return `<div class="calc" role="region" aria-label="증여세 간편 계산기">
  <div class="calc-h">증여세 간편 계산기</div>
  <label for="gtc-amt">증여금액</label>
  <div class="calc-amt"><input id="gtc-amt" type="text" inputmode="numeric" value="700,000,000" aria-label="증여금액(원)"><span>원</span></div>
  <div class="calc-presets">
    <button type="button" data-v="100000000">1억</button>
    <button type="button" data-v="300000000">3억</button>
    <button type="button" data-v="500000000">5억</button>
    <button type="button" data-v="700000000">7억</button>
    <button type="button" data-v="1000000000">10억</button>
  </div>
  <label for="gtc-rel">관계 (증여자 → 받는 사람)</label>
  <select id="gtc-rel">
    <option value="600000000">배우자 (6억 공제)</option>
    <option value="50000000" selected>직계존속 → 성년 자녀 (5천만)</option>
    <option value="20000000">직계존속 → 미성년 자녀 (2천만)</option>
    <option value="50000000">직계비속 → 직계존속 (5천만)</option>
    <option value="10000000">기타 친족 (1천만)</option>
  </select>
  <label class="calc-check"><input id="gtc-mar" type="checkbox"> 혼인·출산 공제 적용 (+1억)</label>
  <div class="calc-out">
    <div><span>증여재산공제</span><b id="gtc-ded">–</b></div>
    <div><span>과세표준</span><b id="gtc-base">–</b></div>
    <div><span>산출세액</span><b id="gtc-calc">–</b></div>
    <div class="calc-final"><span>예상 납부세액 <em>(신고세액공제 3% 반영)</em></span><b id="gtc-final">–</b></div>
  </div>
  <div class="calc-note">2026년 현행 세율 기준 간이 계산입니다. 실제 세액은 재산 종류·평가액·기존 증여 이력에 따라 달라질 수 있으니 신고 전 확인하세요.</div>
  <script>(function(){
    var amt=document.getElementById('gtc-amt'),rel=document.getElementById('gtc-rel'),mar=document.getElementById('gtc-mar');
    var oDed=document.getElementById('gtc-ded'),oBase=document.getElementById('gtc-base'),oCalc=document.getElementById('gtc-calc'),oFinal=document.getElementById('gtc-final');
    function num(s){return Number(String(s).replace(/[^0-9]/g,''))||0;}
    function fmt(n){n=Math.round(n);if(n<=0)return '0원';var e=Math.floor(n/1e8),m=Math.floor((n%1e8)/1e4),s='';if(e)s+=e+'억';if(m)s+=(s?' ':'')+m.toLocaleString('ko-KR')+'만';if(!s)s=n.toLocaleString('ko-KR');return s+'원';}
    var BR=[[1e8,.1,0],[5e8,.2,1e7],[1e9,.3,6e7],[3e9,.4,1.6e8],[Infinity,.5,4.6e8]];
    function run(){
      var a=num(amt.value),ded=num(rel.value)+(mar.checked?1e8:0),base=Math.max(0,a-ded),c=0;
      for(var i=0;i<BR.length;i++){if(base<=BR[i][0]){c=base*BR[i][1]-BR[i][2];break;}}
      oDed.textContent=fmt(ded);oBase.textContent=fmt(base);oCalc.textContent=fmt(c);oFinal.textContent=fmt(c*0.97);
    }
    amt.addEventListener('input',function(){var p=num(amt.value);amt.value=p?p.toLocaleString('ko-KR'):'';run();});
    rel.addEventListener('change',run);mar.addEventListener('change',run);
    Array.prototype.forEach.call(document.querySelectorAll('.calc-presets button'),function(b){b.addEventListener('click',function(){amt.value=Number(b.dataset.v).toLocaleString('ko-KR');run();});});
    run();
  })();</script>
</div>`;
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
    case 'giftTaxCalc': return renderGiftTaxCalc();
    default: return `<!-- unknown block: ${esc(b.type)} -->`;
  }
}
