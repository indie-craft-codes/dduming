// 경제 지표 발표 일정 캘린더 — 정적 표 + D-day island(작은 클라이언트 스크립트).
// 발표일이 확정 공개되는 지표만(값이 계속 변하는 환율·주가·유가 제외).
// 데이터 출처: 미국 PFEI(백악관 OMB) 2026 일정, 연준 FOMC 캘린더, 한국은행 금통위, 통계청.
// 사용: { "type": "econCalendar" }
import { esc } from '../util.mjs';

export const name = 'econCalendar';

let seq = 0;

// d=발표일(현지), kst=한국시각, org=발표기관, ctry='US'|'KR', imp=중요도(2~3)
// 미 서머타임: 2026년 3/8~11/1. EST(겨울) 8:30ET=22:30KST·FOMC 익일04:00 / EDT(여름) 21:30KST·FOMC 익일03:00
const EVENTS_H2 = [
  // 7월
  { d: '2026-07-02', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-07-14', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-07-16', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  { d: '2026-07-16', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-07-29', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-07-30', kst: '21:30', name: 'GDP 2Q 속보', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-07-30', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 8월
  { d: '2026-08-04', kst: '08:00', name: '소비자물가(7월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-08-07', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-08-12', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-08-14', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-08-26', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-08-27', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  // 9월
  { d: '2026-09-02', kst: '08:00', name: '소비자물가(8월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-09-04', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-09-11', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-09-16', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-09-16', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-09-30', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 10월
  { d: '2026-10-02', kst: '08:00', name: '소비자물가(9월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-10-02', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-10-14', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-10-15', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-10-22', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  { d: '2026-10-28', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-10-29', kst: '21:30', name: 'GDP 3Q 속보', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-10-29', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 11월 (미 서머타임 종료 → KST 22:30, FOMC 익일 04:00)
  { d: '2026-11-03', kst: '08:00', name: '소비자물가(10월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-11-06', kst: '22:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-11-10', kst: '22:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-11-17', kst: '22:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-11-25', kst: '22:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-11-26', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  // 12월
  { d: '2026-12-02', kst: '08:00', name: '소비자물가(11월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-12-04', kst: '22:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-12-09', kst: '익일 04:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-12-10', kst: '22:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-12-16', kst: '22:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-12-23', kst: '22:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-12-31', kst: '08:00', name: '소비자물가(12월·연간)', org: '통계청', ctry: 'KR', imp: 2 },
];

// 2026년 상반기(1~6월) — 아카이브. 미 서머타임 이전(1~3.7)은 EST(22:30/익일04:00), 이후는 EDT(21:30/익일03:00).
const EVENTS_H1 = [
  // 1월 (EST)
  { d: '2026-01-09', kst: '22:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-01-13', kst: '22:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-01-15', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  { d: '2026-01-15', kst: '22:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-01-28', kst: '익일 04:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-01-29', kst: '22:30', name: 'GDP 4Q25 속보', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-01-29', kst: '22:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 2월 (EST)
  { d: '2026-02-03', kst: '08:00', name: '소비자물가(1월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-02-06', kst: '22:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-02-11', kst: '22:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-02-17', kst: '22:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-02-26', kst: '22:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-02-26', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  // 3월 (3/6 EST, 이후 EDT)
  { d: '2026-03-06', kst: '22:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-03-06', kst: '08:00', name: '소비자물가(2월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-03-11', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-03-16', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-03-18', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-03-27', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 4월 (EDT)
  { d: '2026-04-02', kst: '08:00', name: '소비자물가(3월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-04-03', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-04-10', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-04-10', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  { d: '2026-04-16', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-04-29', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-04-30', kst: '21:30', name: 'GDP 1Q 속보', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-04-30', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  // 5월 (EDT)
  { d: '2026-05-06', kst: '08:00', name: '소비자물가(4월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-05-08', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-05-12', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-05-14', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-05-28', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
  { d: '2026-05-28', kst: '오전', name: '기준금리(금통위)', org: '한국은행', ctry: 'KR', imp: 3 },
  // 6월 (EDT)
  { d: '2026-06-02', kst: '08:00', name: '소비자물가(5월분)', org: '통계청', ctry: 'KR', imp: 2 },
  { d: '2026-06-05', kst: '21:30', name: '고용보고서(실업률)', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-06-10', kst: '21:30', name: '소비자물가 CPI', org: '노동부 BLS', ctry: 'US', imp: 3 },
  { d: '2026-06-17', kst: '21:30', name: '소매판매', org: '센서스국', ctry: 'US', imp: 2 },
  { d: '2026-06-17', kst: '익일 03:00', name: 'FOMC 기준금리', org: '연준(Fed)', ctry: 'US', imp: 3 },
  { d: '2026-06-25', kst: '21:30', name: 'PCE 물가', org: '상무부 BEA', ctry: 'US', imp: 2 },
];

const WD = ['일', '월', '화', '수', '목', '금', '토'];

export function render(props = {}) {
  const id = `ec-${++seq}`;
  const period = props.period === 'h1' ? 'h1' : 'h2';
  const EVENTS = period === 'h1' ? EVENTS_H1 : EVENTS_H2;
  const title = props.title || `경제 지표 발표 일정 (2026 ${period === 'h1' ? '상반기' : '하반기'})`;
  const stars = (n) => '★'.repeat(n);

  // 월별 그룹
  const byMonth = {};
  for (const e of EVENTS) {
    const m = e.d.slice(0, 7);
    (byMonth[m] = byMonth[m] || []).push(e);
  }

  const monthLabel = (m) => `${Number(m.slice(5, 7))}월`;

  const sections = Object.keys(byMonth).sort().map((m) => {
    const rows = byMonth[m].map((e) => {
      const dt = new Date(e.d + 'T00:00:00');
      const dd = `${Number(e.d.slice(5, 7))}/${Number(e.d.slice(8, 10))}`;
      const wd = WD[dt.getDay()];
      const ctag = e.ctry === 'US'
        ? '<span class="ec-c ec-us">미국</span>'
        : '<span class="ec-c ec-kr">한국</span>';
      return `<tr data-date="${e.d}" class="ec-i${e.imp}">
        <td class="ec-dcell"><b>${dd}</b><span class="ec-wd">(${wd})</span> <span class="ec-dday"></span></td>
        <td>${esc(e.name)}</td>
        <td>${ctag} <span class="ec-org">${esc(e.org)}</span></td>
        <td class="ec-kst">${esc(e.kst)}</td>
        <td class="ec-imp">${stars(e.imp)}</td>
      </tr>`;
    }).join('');
    return `<div class="ec-m">${monthLabel(m)}</div>
      <div class="tablewrap"><table class="ec-t"><thead><tr>
        <th>날짜</th><th>지표</th><th>발표기관</th><th>KST</th><th>중요도</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');

  return `<div class="ec" id="${id}" role="region" aria-label="${esc(title)}">
  <div class="ec-h">${esc(title)}</div>
  <div class="ec-legend">★★★ 시장 핵심 · ★★ 보조 · <span class="ec-c ec-us">미국</span> 21:30/22:30(서머타임) · FOMC는 익일 새벽 · <span class="ec-c ec-kr">한국</span></div>
  ${sections}
  <script>(function(){
    var root=document.getElementById('${id}');
    var today=new Date();today.setHours(0,0,0,0);
    var rows=[].slice.call(root.querySelectorAll('tr[data-date]'));
    var info=rows.map(function(r){
      var d=new Date(r.getAttribute('data-date')+'T00:00:00');
      return {r:r,diff:Math.round((d-today)/86400000)};
    });
    // 미래 발표가 하나도 없으면 아카이브(지난 반기) → D-day·흐림 표시 안 함
    if(!info.some(function(x){return x.diff>=0;}))return;
    var nextEl=null,nextDiff=1e9;
    info.forEach(function(x){
      var b=x.r.querySelector('.ec-dday');
      if(x.diff<0){x.r.classList.add('ec-past');if(b)b.textContent='지남';}
      else{if(b){b.textContent=x.diff===0?'D-DAY':'D-'+x.diff;b.classList.add('on');}
        if(x.diff<nextDiff){nextDiff=x.diff;nextEl=x.r;}}
    });
    if(nextEl){nextEl.classList.add('ec-next');
      var b=nextEl.querySelector('.ec-dday');if(b)b.classList.add('soon');}
  })();</script>
  </div>`;
}

export const css = `
.ec{margin:22px 0}
.ec-h{font-size:17px;font-weight:700;margin-bottom:6px}
.ec-legend{font-size:12.5px;color:var(--sub);margin-bottom:16px;line-height:1.7}
.ec-m{font-size:14px;font-weight:700;color:var(--point);margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
.ec-t{width:100%;border-collapse:collapse;font-size:14.5px}
.ec-t th,.ec-t td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.ec-t th{font-weight:600;color:var(--sub);font-size:13px}
.ec-t td.ec-kst,.ec-t td.ec-imp,.ec-t th:nth-child(4),.ec-t th:nth-child(5){text-align:right}
.ec-dcell b{font-variant-numeric:tabular-nums}
.ec-wd{color:var(--sub);font-size:12.5px;margin-left:2px}
.ec-org{color:var(--sub);font-size:13px}
.ec-imp{color:var(--orange);letter-spacing:-1px}
.ec-c{display:inline-block;font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;color:#fff;vertical-align:1px}
.ec-us{background:var(--point)}
.ec-kr{background:var(--orange)}
.ec-dday{display:none;font-size:11px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px}
.ec-dday.on{display:inline-block;background:color-mix(in srgb,var(--sub) 15%,transparent);color:var(--sub)}
.ec-dday.soon{background:var(--point);color:#fff}
.ec-past{opacity:.4}
.ec-next{background:color-mix(in srgb,var(--point) 7%,transparent)}
.ec-next td{border-bottom-color:var(--point)}
`;
