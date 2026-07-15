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

// 다점 시계열이면 x축 눈금을 ~7개로 솎고 값 라벨 생략
function thinTicks(data, n = 7) {
  if (data.length <= 10) return undefined;
  const step = Math.ceil(data.length / n);
  return data.filter((_, i) => i % step === 0).map(d => d.label);
}

function barChart(b) {
  const last = b.data.length - 1;
  const data = b.data.map((d, i) => ({ ...d, _hl: b.highlightLast && i === last }));
  const many = data.length > 10;
  const showVals = b.showValues ?? !many;
  const fill = (d) => b.highlight && d.label == b.highlight ? '#d1495b' : (d._hl ? POINT : (b.highlight ? POINT : MUTED));
  const marks = [
    Plot.barY(data, { x: 'label', y: 'value', fill, rx: many ? 2 : 4, insetLeft: many ? 1 : 6, insetRight: many ? 1 : 6 }),
    Plot.ruleY([0], { stroke: LINE }),
  ];
  if (showVals) marks.push(Plot.text(data, { x: 'label', y: 'value', text: (d) => fmtVal(d.value, b.format), dy: -9, fill: INK, fontWeight: 600, fontSize: 12 }));
  const chart = Plot.plot({
    document, width: 680, height: 320,
    marginTop: 28, marginRight: 16, marginBottom: 40, marginLeft: 64,
    style: baseStyle,
    x: { type: 'band', label: null, tickSize: 0, ticks: thinTicks(data) },
    y: { label: null, grid: true, ticks: 4, tickFormat: axisFmt(b.format), tickSize: 0 },
    marks,
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

// 'YYYY-MM' 월별 라벨이면 연 시작(-01) 라벨을 ~7개 골라 연도만 표기
function yearTicks(data) {
  const jans = data.filter(d => /-01$/.test(d.label));
  if (!jans.length) return thinTicks(data);
  const step = Math.max(1, Math.ceil(jans.length / 7));
  return jans.filter((_, i) => i % step === 0).map(d => d.label);
}

function lineChart(b) {
  const monthly = b.data.length && /^\d{4}-\d{2}$/.test(b.data[0].label);
  const many = b.data.length > 10;
  const curve = b.curve || 'catmull-rom';
  const showVals = b.showValues ?? !many;
  const showDots = b.data.length <= 30;
  const marks = [
    Plot.areaY(b.data, { x: 'label', y: 'value', fill: POINT, fillOpacity: 0.08, curve }),
    Plot.lineY(b.data, { x: 'label', y: 'value', stroke: POINT, strokeWidth: 2.5, curve }),
  ];
  if (showDots) marks.push(Plot.dot(b.data, { x: 'label', y: 'value', fill: POINT, r: many ? 2.5 : 4 }));
  if (showVals) marks.push(Plot.text(b.data, { x: 'label', y: 'value', text: (d) => fmtVal(d.value, b.format), dy: -12, fill: SUB, fontSize: 11 }));
  const chart = Plot.plot({
    document, width: 680, height: 320,
    marginTop: 24, marginRight: 20, marginBottom: 40, marginLeft: 64,
    style: baseStyle,
    x: { type: 'point', label: null, tickSize: 0, ticks: monthly ? yearTicks(b.data) : thinTicks(b.data), tickFormat: monthly ? ((d) => d.slice(0, 4)) : undefined },
    y: { label: null, grid: true, ticks: 4, tickFormat: axisFmt(b.format), tickSize: 0 },
    marks,
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

// 히스토그램(빗살무늬 분포) — data:[{bin(억), value}], threshold: 강조선(억)
function histogramChart(b) {
  const th = b.threshold;
  const maxV = Math.max(...b.data.map(d => d.value));
  const marks = [
    Plot.rectY(b.data, { x: 'bin', y: 'value', interval: b.binSize || 0.1,
      fill: (d) => th != null && Math.abs(d.bin - th) < 0.001 ? '#d1495b' : POINT, fillOpacity: 0.9 }),
    Plot.ruleY([0], { stroke: LINE }),
  ];
  if (th != null) {
    marks.push(Plot.ruleX([th], { stroke: '#d1495b', strokeWidth: 1.4, strokeDasharray: '4 4' }));
    marks.push(Plot.text([{ x: th, y: maxV }], { x: 'x', y: 'y', text: () => `${th}억`, dy: -6, dx: 5, textAnchor: 'start', fill: '#d1495b', fontWeight: 700, fontSize: 13 }));
  }
  const chart = Plot.plot({
    document, width: 680, height: 340,
    marginTop: 24, marginRight: 16, marginBottom: 40, marginLeft: 48,
    style: baseStyle,
    x: { label: null, tickFormat: (d) => d + '억', tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickSize: 0 },
    marks,
  });
  return responsive(chart);
}

export function renderChart(b) {
  const cap = b.caption ? `<div class="cap" style="text-align:center;margin:14px 0 0">${esc(b.caption)}</div>` : '';
  let body;
  try {
    body = b.chartType === 'line' ? lineChart(b)
      : b.chartType === 'donut' ? donutChart(b)
      : b.chartType === 'hbar' ? hbarChart(b)
      : b.chartType === 'histogram' ? histogramChart(b)
      : barChart(b);
  } catch (e) {
    body = `<!-- chart error: ${esc(e.message)} -->`;
  }
  return `<figure class="chart">${body}${cap}</figure>`;
}
