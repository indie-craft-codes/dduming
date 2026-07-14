// 컴포넌트 레지스트리 — 새 인터랙티브 컴포넌트는 여기에 한 줄만 추가.
import * as giftTaxCalc from './gift-tax-calc.mjs';

const modules = [giftTaxCalc];

// 이름 → 컴포넌트 모듈
export const components = Object.fromEntries(modules.map(m => [m.name, m]));

// 모든 컴포넌트 CSS 합본 (빌드가 스타일시트에 append)
export const componentsCss = modules.map(m => m.css || '').join('\n');

// 상단 고정 배치 컴포넌트 이름 집합 (placement === 'top')
export const topComponents = new Set(modules.filter(m => m.placement === 'top').map(m => m.name));

// 블록 렌더: 등록된 컴포넌트면 render(props), 아니면 null
export function renderComponent(block) {
  const c = components[block.type];
  return c ? c.render(block) : null;
}
