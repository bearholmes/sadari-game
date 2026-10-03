import type { PathPoint } from '../ladder.ts';

export const BOARD = {
  colWidth: 76,
  padX: 48,
  topPad: 92,
  ladderHeight: 320,
  stepMs: 170,
} as const;

export type BoardLayout = {
  x: (col: number) => number;
  y: (row: number) => number;
  yBottom: number;
  width: number;
  height: number;
};

export function createLayout(n: number, rowCount: number, bottomPad = 68): BoardLayout {
  const pitch = BOARD.ladderHeight / (rowCount + 1);
  const x = (col: number) => BOARD.padX + col * BOARD.colWidth;
  const y = (row: number) => BOARD.topPad + (row + 1) * pitch;
  const yBottom = BOARD.topPad + BOARD.ladderHeight;
  return {
    x,
    y,
    yBottom,
    width: BOARD.padX * 2 + (n - 1) * BOARD.colWidth,
    height: yBottom + bottomPad,
  };
}

export function trailPoints(
  path: PathPoint[],
  x: (c: number) => number,
  y: (r: number) => number,
  yBottom: number,
  upto: number,
): string {
  const pts = [`${x(path[0].pos)},${y(path[0].row)}`];
  const end = upto < 0 ? path.length - 1 : Math.min(upto, path.length - 1);
  for (let i = 1; i <= end; i++) {
    pts.push(`${x(path[i - 1].pos)},${y(path[i].row)}`);
    pts.push(`${x(path[i].pos)},${y(path[i].row)}`);
  }
  if (upto < 0 || end >= path.length - 1) {
    pts.push(`${x(path[path.length - 1].pos)},${yBottom}`);
  }
  return pts.join(' ');
}
