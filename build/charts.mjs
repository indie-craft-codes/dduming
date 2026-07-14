// 빌드 타임 SVG 차트 (Observable Plot + d3-shape). 페이지에는 JS 0.
import { JSDOM } from 'jsdom';
import * as Plot from '@observablehq/plot';
import { arc as d3arc } from 'd3-shape';
import { esc } from './util.mjs';

const { window } = new JSDOM('');
const document = window.document;

// 브랜드 색
const POINT = '#3b6ef5';
const MUTED = '#c9d6f5';
const INK = '#18181b';
const SUB = '#6b6b70';
const LINE = '#e6e6ea';

const commaNum = (n) => Number(n).toLocaleString('ko-KR');
const moneyKo = (n) => {
  n = Math.round(n); if (n <= 0) return '0';
  const e = Math.floor(n / 1e8), m = Math.floor((n % 1e8) / 1e4); let s = '';
  if (e) s += e + '억';
  if (m) s += (s ? ' ' : '') + m.toLocaleString('ko-KR') + '만';
  if (!s) s = n.toLocaleString('ko-KR');
  return s + '원';
};
const fmtVal = (v, fmt) => fmt === 'money' ? moneyKo(v) : commaNum(v);
// 축 눈금용 짧은 표기
const shortMoney = (n) => {
  if (n >= 1e8) return +(n / 1e8).toFixed(n % 1e8 ? 1 : 0) + '억';
  if (n >= 1e4) return +(n / 1e4).toFixed(0) + '만';
  return commaNum(n);
};
const axisFmt = (fmt) => fmt === 'money' ? shortMoney : commaNum;

// Plot SVG를 반응형으로: viewBox 부여 + width 100%
function responsive(el) {
  const w = el.getAttribute('width'), h = el.getAttribute('height');
  if (w && h && !el.getAttribute('viewBox')) el.setAttribute('viewBox', `0 0 ${w} ${h}`);
  el.removeAttribute('width'); el.removeAttribute('height');
  el.setAttribute('style', `${el.getAttribute('style') || ''};max-width:100%;height:auto;font-family:inherit`);
  return el.outerHTML;
}

const baseStyle = { background: 'transparent', color: SUB, fontSize: '13px', fontFamily: 'inherit' };

function barChart(b) {
  const data = b.data.map((d, i) => ({ ...d, _hl: b.highlightLast && i === b.data.length - 1 }));
  const chart = Plot.plot({
    document, width: 680, height: 320,
    marginTop: 28, marginRight: 16, marginBottom: 40, marginLeft: 64,
    style: baseStyle,
    x: { label: null, tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickFormat: axisFmt(b.format), tickSize: 0 },
    marks: [
      Plot.barY(data, { x: 'label', y: 'value', fill: (d) => d._hl ? POINT : MUTED, rx: 4, insetLeft: 6, insetRight: 6 }),
      Plot.ruleY([0], { stroke: LINE }),
      Plot.text(data, { x: 'label', y: 'value', text: (d) => fmtVal(d.value, b.format), dy: -9, fill: INK, fontWeight: 600, fontSize: 12 }),
    ],
  });
  return responsive(chart);
}

function hbarChart(b) {
  const chart = Plot.plot({
    document, width: 680, height: Math.max(160, b.data.length * 46 + 40),
    marginTop: 12, marginRight: 64, marginBottom: 24, marginLeft: 88,
    style: baseStyle,
    x: { label: null, grid: true, ticks: 4, tickFormat: axisFmt(b.format), tickSize: 0 },
    y: { label: null, tickSize: 0 },
    marks: [
      Plot.barX(b.data, { y: 'label', x: 'value', fill: POINT, ry: 4, sort: { y: 'x', reverse: true } }),
      Plot.ruleX([0], { stroke: LINE }),
      Plot.text(b.data, { y: 'label', x: 'value', text: (d) => fmtVal(d.value, b.format), dx: 8, textAnchor: 'start', fill: INK, fontWeight: 600, fontSize: 12 }),
    ],
  });
  return responsive(chart);
}

function lineChart(b) {
  const chart = Plot.plot({
    document, width: 680, height: 320,
    marginTop: 24, marginRight: 20, marginBottom: 40, marginLeft: 64,
    style: baseStyle,
    x: { label: null, tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickFormat: axisFmt(b.format), tickSize: 0 },
    marks: [
      Plot.areaY(b.data, { x: 'label', y: 'value', fill: POINT, fillOpacity: 0.08, curve: 'catmull-rom' }),
      Plot.lineY(b.data, { x: 'label', y: 'value', stroke: POINT, strokeWidth: 2.5, curve: 'catmull-rom' }),
      Plot.dot(b.data, { x: 'label', y: 'value', fill: POINT, r: 4 }),
      Plot.text(b.data, { x: 'label', y: 'value', text: (d) => fmtVal(d.value, b.format), dy: -12, fill: SUB, fontSize: 11 }),
    ],
  });
  return responsive(chart);
}

// 도넛(단일 비율%) — d3-shape arc
function donutChart(b) {
  const v = Math.max(0, Math.min(100, b.value ?? 0));
  const R = 84, r = 54, cx = 100, cy = 100;
  const arcGen = d3arc().innerRadius(r).outerRadius(R).cornerRadius(4);
  const bg = arcGen({ startAngle: 0, endAngle: 2 * Math.PI });
  const fg = arcGen({ startAngle: 0, endAngle: 2 * Math.PI * v / 100 });
  return `<svg viewBox="0 0 200 200" width="100%" style="max-width:220px;height:auto;display:block;margin:0 auto;font-family:inherit">`
    + `<path d="${bg}" transform="translate(${cx},${cy})" fill="${LINE}"/>`
    + `<path d="${fg}" transform="translate(${cx},${cy}) rotate(-0.0001)" fill="${POINT}"/>`
    + `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="30" font-weight="700" fill="${INK}">${v}%</text>`
    + `</svg>`;
}

export function renderChart(b) {
  const cap = b.caption ? `<div class="cap" style="text-align:center;margin:14px 0 0">${esc(b.caption)}</div>` : '';
  let body;
  try {
    body = b.chartType === 'line' ? lineChart(b)
      : b.chartType === 'donut' ? donutChart(b)
      : b.chartType === 'hbar' ? hbarChart(b)
      : barChart(b);
  } catch (e) {
    body = `<!-- chart error: ${esc(e.message)} -->`;
  }
  return `<figure class="chart">${body}${cap}</figure>`;
}
