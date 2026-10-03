// 사다리타기 순수 로직: 생성·탐색·경로·결과셔플. React 비의존.

export type Rung = { row: number; left: number };
export type PathPoint = { row: number; pos: number };
export type ResultItem = { text: string; win: boolean };
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toRng(rng: Rng | number | undefined): Rng {
  if (typeof rng === 'function') return rng;
  if (typeof rng === 'number') return createRng(rng);
  return Math.random;
}

export function defaultRowCount(_n: number): number {
  return 8;
}

export type GenerateOptions = {
  rng?: Rng | number;
  density?: number;
  minTotal?: number;
};

// 수평선 생성. 반환: [{ row, left }] (row 오름차순 정렬).
// 같은 row 내 left 값은 최소 2 이상 떨어진다(겹침 금지).
export function generateRungs(n: number, rowCount: number, options: GenerateOptions = {}): Rung[] {
  if (!Number.isInteger(n) || n < 2) throw new Error('참가자는 2명 이상이어야 합니다.');
  if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > 8) {
    throw new Error('행 수는 1~8 범위여야 합니다.');
  }
  const rng = toRng(options.rng);
  const density = options.density ?? 0.8;
  const rungs: Rung[] = [];
  for (let row = 0; row < rowCount; row++) {
    const placed: number[] = [];
    let pos = 0;
    while (pos < n - 1) {
      if (rng() < density) {
        placed.push(pos);
        pos += 2;
      } else {
        pos += 1;
      }
    }
    if (placed.length === 0) placed.push(Math.floor(rng() * (n - 1)));
    for (const left of placed) rungs.push({ row, left });
  }
  const minTotal = options.minTotal ?? n;
  if (rungs.length < minTotal) {
    const occupied = new Set(rungs.map((r) => r.row * n + r.left));
    let guard = rowCount * n * 4;
    while (rungs.length < minTotal && guard-- > 0) {
      const row = Math.floor(rng() * rowCount);
      const left = Math.floor(rng() * (n - 1));
      const key = row * n + left;
      const clash =
        occupied.has(key) ||
        (left > 0 && occupied.has(key - 1)) ||
        (left < n - 2 && occupied.has(key + 1));
      if (clash) continue;
      occupied.add(key);
      rungs.push({ row, left });
    }
  }
  rungs.sort((a, b) => a.row - b.row || a.left - b.left);
  return rungs;
}

// 시작점 s의 도착점. rungs는 row 정렬 가정.
export function trace(rungs: Rung[], start: number): number {
  let pos = start;
  for (const r of rungs) {
    if (r.left === pos) pos += 1;
    else if (r.left === pos - 1) pos -= 1;
  }
  return pos;
}

export function computeMapping(n: number, rungs: Rung[]): number[] {
  return Array.from({ length: n }, (_, s) => trace(rungs, s));
}

// 경로: [{ row, pos }] — row=-1은 출발점, row=r은 r행 통과 후 위치.
export function getPath(rungs: Rung[], start: number): PathPoint[] {
  const points: PathPoint[] = [{ row: -1, pos: start }];
  let pos = start;
  const byRow = new Map<number, number[]>();
  for (const r of rungs) {
    if (!byRow.has(r.row)) byRow.set(r.row, []);
    byRow.get(r.row)?.push(r.left);
  }
  const maxRow = rungs.length > 0 ? rungs[rungs.length - 1].row : -1;
  for (let row = 0; row <= maxRow; row++) {
    for (const left of byRow.get(row) ?? []) {
      if (left === pos) pos += 1;
      else if (left === pos - 1) pos -= 1;
    }
    points.push({ row, pos });
  }
  return points;
}

// 항목 셔플: 입력 항목을 도착점 순서로 섞는다. 멀티셋이 보존된다.
export function shuffleResults(
  results: ResultItem[],
  options: { rng?: Rng | number } = {},
): ResultItem[] {
  if (!Array.isArray(results) || results.length < 2) {
    throw new Error('결과는 2개 이상이어야 합니다.');
  }
  if (!results.some((r) => r?.win)) {
    throw new Error('당첨은 최소 1개 있어야 합니다.');
  }
  const rng = toRng(options.rng);
  const arr = results.map((r) => ({ text: r.text ?? '', win: r.win === true }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 컬럼별 연결수: 각 수직선에 닿는 수평선 개수.
export function columnConnections(n: number, rungs: Rung[]): number[] {
  const counts = new Array<number>(n).fill(0);
  for (const r of rungs) {
    counts[r.left] += 1;
    counts[r.left + 1] += 1;
  }
  return counts;
}

export function isPermutation(mapping: number[]): boolean {
  const sorted = [...mapping].sort((a, b) => a - b);
  return sorted.every((v, i) => v === i);
}

export function hasOverlap(rungs: Rung[]): boolean {
  const seen = new Map<number, number[]>();
  for (const r of rungs) {
    if (!seen.has(r.row)) seen.set(r.row, []);
    seen.get(r.row)?.push(r.left);
  }
  for (const lefts of seen.values()) {
    const sorted = [...lefts].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] < 2) return true;
    }
  }
  return false;
}

export type GameCore = {
  n: number;
  rowCount: number;
  rungs: Rung[];
  mapping: number[];
  outcomes: ResultItem[];
};

export type CreateGameArgs = {
  n: number;
  results: ResultItem[];
  rowCount?: number;
  seed?: number;
  density?: number;
};

export function createGame({ n, results, rowCount, seed, density }: CreateGameArgs): GameCore {
  if (!Number.isInteger(n) || n < 2 || n > 16) {
    throw new Error('참가자 수는 2~16 범위여야 합니다.');
  }
  if (!Array.isArray(results) || results.length !== n) {
    throw new Error('결과 개수는 참가자 수와 같아야 합니다.');
  }
  const rows = rowCount ?? defaultRowCount(n);
  const rng = seed === undefined ? Math.random : createRng(seed);
  const rungs = generateRungs(n, rows, { rng, density });
  const mapping = computeMapping(n, rungs);
  const outcomes = shuffleResults(results, { rng });
  return { n, rowCount: rows, rungs, mapping, outcomes };
}
