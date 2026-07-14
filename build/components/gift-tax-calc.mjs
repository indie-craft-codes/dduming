// 증여세 간편 계산기 — 재사용 인터랙티브 컴포넌트(island).
// 사용: 글 blocks에 { "type": "giftTaxCalc" }  (옵션: title, defaultAmount, presets)
import { esc } from '../util.mjs';

export const name = 'giftTaxCalc';
export const placement = 'top'; // 커버 다음(요약 위)에 배치

let seq = 0;

export function render(props = {}) {
  const id = `gtc-${++seq}`; // 인스턴스별 고유 id → 한 페이지 여러 개 OK
  const title = props.title || '증여세 간편 계산기';
  const amount = Number(props.defaultAmount) || 700000000;
  const presets = props.presets || [1e8, 3e8, 5e8, 7e8, 1e9];
  const won = (n) => n.toLocaleString('ko-KR');
  const eok = (n) => `${n / 1e8 % 1 === 0 ? n / 1e8 : (n / 1e8).toFixed(1)}억`;
  const presetBtns = presets.map(v => `<button type="button" data-v="${v}">${eok(v)}</button>`).join('');

  return `<div class="calc" id="${id}" role="region" aria-label="${esc(title)}">
  <div class="calc-h">${esc(title)}</div>
  <label>증여금액</label>
  <div class="calc-amt"><input class="gtc-amt" type="text" inputmode="numeric" value="${won(amount)}" aria-label="증여금액(원)"><span>원</span></div>
  <div class="calc-presets">${presetBtns}</div>
  <label>관계 (증여자 → 받는 사람)</label>
  <select class="gtc-rel">
    <option value="600000000">배우자 (6억 공제)</option>
    <option value="50000000" selected>직계존속 → 성년 자녀 (5천만)</option>
    <option value="20000000">직계존속 → 미성년 자녀 (2천만)</option>
    <option value="50000000">직계비속 → 직계존속 (5천만)</option>
    <option value="10000000">기타 친족 (1천만)</option>
  </select>
  <label class="calc-check"><input class="gtc-mar" type="checkbox"> 혼인·출산 공제 적용 (+1억)</label>
  <div class="calc-out">
    <div><span>증여재산공제</span><b class="gtc-ded">–</b></div>
    <div><span>과세표준</span><b class="gtc-base">–</b></div>
    <div><span>산출세액</span><b class="gtc-calc">–</b></div>
    <div class="calc-final"><span>예상 납부세액 <em>(신고세액공제 3% 반영)</em></span><b class="gtc-final">–</b></div>
  </div>
  <div class="calc-note">2026년 현행 세율 기준 간이 계산입니다. 실제 세액은 재산 종류·평가액·기존 증여 이력에 따라 달라질 수 있으니 신고 전 확인하세요.</div>
  <script>(function(){
    var root=document.getElementById('${id}');
    var amt=root.querySelector('.gtc-amt'),rel=root.querySelector('.gtc-rel'),mar=root.querySelector('.gtc-mar');
    var oDed=root.querySelector('.gtc-ded'),oBase=root.querySelector('.gtc-base'),oCalc=root.querySelector('.gtc-calc'),oFinal=root.querySelector('.gtc-final');
    function num(s){return Number(String(s).replace(/[^0-9]/g,''))||0;}
    function fmt(n){return Math.round(n).toLocaleString('ko-KR')+'원';}
    var BR=[[1e8,.1,0],[5e8,.2,1e7],[1e9,.3,6e7],[3e9,.4,1.6e8],[Infinity,.5,4.6e8]];
    function run(){
      var a=num(amt.value),ded=num(rel.value)+(mar.checked?1e8:0),base=Math.max(0,a-ded),c=0;
      for(var i=0;i<BR.length;i++){if(base<=BR[i][0]){c=base*BR[i][1]-BR[i][2];break;}}
      oDed.textContent=fmt(ded);oBase.textContent=fmt(base);oCalc.textContent=fmt(c);oFinal.textContent=fmt(c*0.97);
    }
    amt.addEventListener('input',function(){var p=num(amt.value);amt.value=p?p.toLocaleString('ko-KR'):'';run();});
    rel.addEventListener('change',run);mar.addEventListener('change',run);
    Array.prototype.forEach.call(root.querySelectorAll('.calc-presets button'),function(b){b.addEventListener('click',function(){amt.value=Number(b.dataset.v).toLocaleString('ko-KR');run();});});
    run();
  })();</script>
</div>`;
}

export const css = `
.calc{border:1px solid var(--line);border-radius:12px;padding:22px;margin:0 0 30px;background:#fff}
.calc-h{font-weight:700;font-size:18px;margin-bottom:8px}
.calc label{display:block;font-size:13px;color:var(--sub);font-weight:500;margin:14px 0 6px}
.calc input[type=text],.calc select{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:16px;background:#fff;color:var(--ink)}
.calc-amt{display:flex;align-items:center;gap:8px}
.calc-amt input{text-align:right;font-weight:600}
.calc-amt span{color:var(--sub);flex:none}
.calc-presets{display:flex;gap:6px;margin-top:8px}
.calc-presets button{flex:1;padding:8px 4px;border:1px solid var(--line);border-radius:8px;background:#fff;font:inherit;font-size:13px;color:var(--ink);cursor:pointer}
.calc-presets button:hover{border-color:var(--point);color:var(--point)}
.calc-check{display:flex;align-items:center;gap:8px;font-size:14.5px;line-height:1.3;color:var(--ink);margin-top:16px;cursor:pointer}
.calc-check input{width:18px;height:18px;flex:none;margin:0;accent-color:var(--point)}
.calc-out{margin-top:18px;border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:9px}
.calc-out>div{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;color:var(--sub)}
.calc-out b{font-size:15px;color:var(--ink);font-weight:600}
.calc-final{border-top:1px dashed var(--line);margin-top:6px;padding-top:13px}
.calc-final span{color:var(--ink);font-weight:600;max-width:60%}
.calc-final em{color:var(--sub);font-weight:400;font-style:normal;font-size:11.5px;display:block}
.calc-final b{font-size:21px}
.calc-final b.gtc-final{color:var(--point)}
.calc-note{font-size:12px;color:var(--sub);margin-top:14px;line-height:1.6}
`;
