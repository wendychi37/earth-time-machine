/** 依名稱產生穩定的顏色（同一政權在不同年份顏色一致）。 */
function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

export function colorForName(name: string): [number, number, number] {
  const h = hashString(name);
  return hslToRgb(h % 360, 0.5 + ((h >> 9) % 20) / 100, 0.5 + ((h >> 17) % 12) / 100);
}
