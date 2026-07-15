// 부동산 매수 비용 계산기 — 필수(취득세·중개보수·인지세) + 추가(채권·법무사·이사·인테리어·선수관리비). 재사용 island.
// 사용: { "type": "buyCostCalc" }  (옵션: title, defaultAmount, presets)
import { esc } from '../util.mjs';

export const name = 'buyCostCalc';
export const placement = 'top';

let seq = 0;

export function render(props = {}) {
  const id = `bcc-${++seq}`;
  const title = props.title || '부동산 매수 비용 계산기';
  const amount = Number(props.defaultAmount) || 1000000000;
  const presets = props.presets || [5e8, 7e8, 1e9, 1.5e9, 2e9];
  const won = (n) => n.toLocaleString('ko-KR');
  const eok = (n) => `${n / 1e8 % 1 === 0 ? n / 1e8 : (n / 1e8).toFixed(1)}억`;
  const presetBtns = presets.map(v => `<button type="button" data-v="${v}">${eok(v)}</button>`).join('');

  return `<div class="calc" id="${id}" role="region" aria-label="${esc(title)}">
  <div class="calc-h">${esc(title)}</div>
  <label>매매가</label>
  <div class="calc-amt"><input class="bc-amt" type="text" inputmode="numeric" value="${won(amount)}" aria-label="매매가(원)"><span>원</span></div>
  <div class="calc-presets">${presetBtns}</div>
  <label>보유 주택 수 (취득세 중과)</label>
  <select class="bc-tier">
    <option value="basic" selected>1주택 (기본세율 1~3%)</option>
    <option value="multi2">조정지역 2주택 (8%)</option>
    <option value="multi3">3주택 이상 (12%)</option>
  </select>
  <label class="calc-check"><input class="bc-over85" type="checkbox"> 전용면적 85㎡ 초과 (농어촌특별세)</label>

  <div class="bc-extra">
    <div class="bc-hint">추가 비용 — 편차가 커서 <b>기본값은 예시</b>입니다. 상황에 맞게 조정하거나 0으로 지우세요.</div>
    <div class="bc-row"><span>국민주택채권 할인손실 <em>대략</em></span><span><input class="bc-bond" type="text" inputmode="numeric">원</span></div>
    <div class="bc-row"><span>법무사비</span><span><input class="bc-legal" type="text" inputmode="numeric" value="400,000">원</span></div>
    <div class="bc-row"><span>이사비용</span><span><input class="bc-move" type="text" inputmode="numeric" value="1,500,000">원</span></div>
    <div class="bc-row"><span>인테리어</span><span><input class="bc-reno" type="text" inputmode="numeric" value="0">원</span></div>
    <div class="bc-row"><span>선수관리비</span><span><input class="bc-mgmt" type="text" inputmode="numeric" value="300,000">원</span></div>
  </div>

  <div class="calc-out">
    <div><span>취득세 (지방교육세·농특세 포함)</span><b class="bc-acq">–</b></div>
    <div><span>중개보수 (상한·부가세 포함)</span><b class="bc-brk">–</b></div>
    <div><span>인지세</span><b class="bc-stamp">–</b></div>
    <div><span>추가 비용 (채권·법무사·이사 등)</span><b class="bc-extra-sum">–</b></div>
    <div class="calc-final"><span>예상 총비용 <em>(입력값 기준)</em></span><b class="bc-total">–</b></div>
  </div>
  <div class="calc-note">2026년 현행 요율 기준 간이 계산입니다. 취득세 중과·감면, 채권 할인율, 조정대상지역 여부 등에 따라 실제 금액은 달라지니 거래 전 확인하세요.</div>
  <script>(function(){
    var root=document.getElementById('${id}');
    var amt=root.querySelector('.bc-amt'),tier=root.querySelector('.bc-tier'),o85=root.querySelector('.bc-over85');
    var bond=root.querySelector('.bc-bond'),legal=root.querySelector('.bc-legal'),move=root.querySelector('.bc-move'),reno=root.querySelector('.bc-reno'),mgmt=root.querySelector('.bc-mgmt');
    var oAcq=root.querySelector('.bc-acq'),oBrk=root.querySelector('.bc-brk'),oStamp=root.querySelector('.bc-stamp'),oExtra=root.querySelector('.bc-extra-sum'),oTot=root.querySelector('.bc-total');
    var bondTouched=false;
    function num(s){return Number(String(s).replace(/[^0-9]/g,''))||0;}
    function fmt(n){return Math.round(n).toLocaleString('ko-KR')+'원';}
    function acqTax(p,t,over){var eok=p/1e8,base,edu,rural=0;
      if(t==='multi2'){base=p*0.08;edu=p*0.004;if(over)rural=p*0.006;}
      else if(t==='multi3'){base=p*0.12;edu=p*0.004;if(over)rural=p*0.01;}
      else{var r;if(eok<=6)r=0.01;else if(eok<=9)r=(eok*2/3-3)/100;else r=0.03;base=p*r;edu=p*r*0.1;if(over)rural=p*0.002;}
      return base+edu+rural;}
    function broker(p){var e=p/1e8,r;if(e<0.5)r=0.006;else if(e<2)r=0.005;else if(e<9)r=0.004;else if(e<12)r=0.005;else if(e<15)r=0.006;else r=0.007;return p*r*1.1;}
    function stamp(p){if(p<=1e7)return 0;if(p<=3e7)return 20000;if(p<=5e7)return 40000;if(p<=1e8)return 70000;if(p<=1e9)return 150000;return 350000;}
    function bondEst(p){return Math.round(p*0.7*0.031*0.13/1000)*1000;} // 공시≈70%×매입률3.1%×할인율13%
    function autoBond(){if(!bondTouched)bond.value=bondEst(num(amt.value)).toLocaleString('ko-KR');}
    function reformat(el){var v=num(el.value);el.value=v?v.toLocaleString('ko-KR'):'0';}
    function run(){
      var p=num(amt.value),a=acqTax(p,tier.value,o85.checked),b=broker(p),s=stamp(p);
      var extra=num(bond.value)+num(legal.value)+num(move.value)+num(reno.value)+num(mgmt.value);
      oAcq.textContent=fmt(a);oBrk.textContent=fmt(b);oStamp.textContent=fmt(s);oExtra.textContent=fmt(extra);oTot.textContent=fmt(a+b+s+extra);
    }
    amt.addEventListener('input',function(){var v=num(amt.value);amt.value=v?v.toLocaleString('ko-KR'):'';autoBond();run();});
    tier.addEventListener('change',run);o85.addEventListener('change',run);
    bond.addEventListener('input',function(){bondTouched=true;reformat(bond);run();});
    [legal,move,reno,mgmt].forEach(function(el){el.addEventListener('input',function(){reformat(el);run();});});
    Array.prototype.forEach.call(root.querySelectorAll('.calc-presets button'),function(bt){bt.addEventListener('click',function(){amt.value=Number(bt.dataset.v).toLocaleString('ko-KR');autoBond();run();});});
    autoBond();run();
  })();</script>
</div>`;
}

export const css = `
.bc-extra{margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
.bc-extra .bc-hint{font-size:12px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.bc-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:9px 0}
.bc-row>span:first-child{font-size:13.5px;color:var(--sub)}
.bc-row em{font-style:normal;color:var(--orange);font-size:11px}
.bc-row>span:last-child{color:var(--sub);font-size:13px;white-space:nowrap}
.bc-row input{width:130px;text-align:right;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:15px;margin-right:4px}
`;
