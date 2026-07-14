// 공용 유틸 (컴포넌트·블록 공유). 순환 import 방지용 최소 모듈.
export const esc = (s = '') => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');
