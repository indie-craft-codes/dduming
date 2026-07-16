// AdSense 수동 광고 유닛 — 공간 예약형(CLS 방지). SITE.adsenseClient + 해당 위치 슬롯ID가 모두 있을 때만 렌더.
// 미승인/미설정 상태에서는 아무것도 출력하지 않아 성능·디자인에 영향 없음.
// 사용: 빌드가 본문에 { type:'adSlot', pos:'articleTop'|'articleBottom' } 로 주입.
import { SITE } from '../theme.mjs';

export const name = 'adSlot';

export function render(props = {}) {
  const pos = props.pos || 'articleTop';
  const slot = (SITE.adsenseSlots || {})[pos];
  if (!SITE.adsenseClient || !slot) return ''; // 미설정 → 노출·예약 없음
  return `<div class="adslot" aria-label="광고"><ins class="adsbygoogle" style="display:block" `
    + `data-ad-client="${SITE.adsenseClient}" data-ad-slot="${slot}" `
    + `data-ad-format="auto" data-full-width-responsive="true"></ins>`
    + `<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

// 최소 높이로 공간을 미리 잡아 광고 로드 시 레이아웃 흔들림(CLS) 최소화.
export const css = `
.adslot{min-height:100px;margin:28px 0;text-align:center;overflow:hidden;background:color-mix(in srgb,var(--sub) 4%,transparent)}
.adslot::before{content:'광고';display:block;font-size:11px;color:var(--sub);opacity:.6;padding-top:4px}
.adslot .adsbygoogle{margin-top:2px}
`;
