export const FRUIT_COUNT = 16;

export function fruitSrc(i: number): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base}fruits/fruit-${String(i).padStart(2, '0')}.webp`;
}

export function shuffledFruits(n: number): number[] {
  const idx = Array.from({ length: FRUIT_COUNT }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n);
}

export function firstUnusedFruit(used: Set<number>): number {
  for (let i = 0; i < FRUIT_COUNT; i++) {
    if (!used.has(i)) return i;
  }
  return 0;
}

export function nextUnusedFruit(used: Set<number>, from: number): number {
  for (let i = 1; i <= FRUIT_COUNT; i++) {
    const c = (from + i) % FRUIT_COUNT;
    if (!used.has(c)) return c;
  }
  return from;
}
