export function playerColor(i: number, n: number): string {
  const hue = Math.round((i * 360) / Math.max(n, 1));
  return `hsl(${hue}, 70%, 42%)`;
}
