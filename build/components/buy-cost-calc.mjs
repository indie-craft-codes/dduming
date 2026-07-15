// 부동산 매수 비용 계산기 — 취득세(+교육세·농특세)·중개보수·인지세. 재사용 island.
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
  <div class="calc-out">
    <div><span>취득세 (지방교육세·농특세 포함)</span><b class="bc-acq">–</b></div>
    <div><span>중개보수 (상한·부가세 포함)</span><b class="bc-brk">–</b></div>
    <div><span>인지세</span><b class="bc-stamp">–</b></div>
    <div class="calc-final"><span>예상 총비용 <em>(채권·법무사비 별도)</em></span><b class="bc-total">–</b></div>
  </div>
  <div class="calc-note">2026년 현행 요율 기준 간이 계산입니다. 취득세 중과·감면, 국민주택채권 할인손실, 법무사 대행료 등은 개인·물건별로 달라지니 실제 거래 전 확인하세요.</div>
  <script>(function(){
    var root=document.getElementById('${id}');
    var amt=root.querySelector('.bc-amt'),tier=root.querySelector('.bc-tier'),o85=root.querySelector('.bc-over85');
    var oAcq=root.querySelector('.bc-acq'),oBrk=root.querySelector('.bc-brk'),oStamp=root.querySelector('.bc-stamp'),oTot=root.querySelector('.bc-total');
    function num(s){return Number(String(s).replace(/[^0-9]/g,''))||0;}
    function fmt(n){return Math.round(n).toLocaleString('ko-KR')+'원';}
    function acqTax(p,t,over){
      var eok=p/1e8, base, edu, rural=0;
      if(t==='multi2'){ base=p*0.08; edu=p*0.004; if(over)rural=p*0.006; }
      else if(t==='multi3'){ base=p*0.12; edu=p*0.004; if(over)rural=p*0.01; }
      else { var r; if(eok<=6)r=0.01; else if(eok<=9)r=(eok*2/3-3)/100; else r=0.03;
        base=p*r; edu=p*r*0.1; if(over)rural=p*0.002; }
      return base+edu+rural;
    }
    function broker(p){ var e=p/1e8,r;
      if(e<0.5)r=0.006; else if(e<2)r=0.005; else if(e<9)r=0.004; else if(e<12)r=0.005; else if(e<15)r=0.006; else r=0.007;
      return p*r*1.1; } // 상한 + 부가세 10%
    function stamp(p){ if(p<=1e7)return 0; if(p<=3e7)return 20000; if(p<=5e7)return 40000; if(p<=1e8)return 70000; if(p<=1e9)return 150000; return 350000; }
    function run(){
      var p=num(amt.value), a=acqTax(p,tier.value,o85.checked), b=broker(p), s=stamp(p);
      oAcq.textContent=fmt(a); oBrk.textContent=fmt(b); oStamp.textContent=fmt(s); oTot.textContent=fmt(a+b+s);
    }
    amt.addEventListener('input',function(){var v=num(amt.value);amt.value=v?v.toLocaleString('ko-KR'):'';run();});
    tier.addEventListener('change',run); o85.addEventListener('change',run);
    Array.prototype.forEach.call(root.querySelectorAll('.calc-presets button'),function(bt){bt.addEventListener('click',function(){amt.value=Number(bt.dataset.v).toLocaleString('ko-KR');run();});});
    run();
  })();</script>
</div>`;
}

export const css = ''; // 계산기 공용 스타일(.calc*)은 gift-tax-calc.mjs가 제공
