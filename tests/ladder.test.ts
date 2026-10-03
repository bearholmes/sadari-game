import test from 'node:test';
import assert from 'node:assert/strict';
import {
  columnConnections,
  computeMapping,
  createGame,
  defaultRowCount,
  generateRungs,
  getPath,
  hasOverlap,
  isPermutation,
  shuffleResults,
  trace,
} from '../src/ladder.ts';
import type { ResultItem } from '../src/ladder.ts';

const NS = [2, 4, 8, 16];
const SEEDS = [1, 7, 42, 1234, 99999];

function makeResults(n: number, k = 1): ResultItem[] {
  return Array.from({ length: n }, (_, i) => ({ text: `r${i}`, win: i < k }));
}

test('불변식 1: 같은 행의 수평선은 겹치지 않는다', () => {
  for (const n of NS) {
    for (const seed of SEEDS) {
      const rungs = generateRungs(n, defaultRowCount(n), { rng: seed });
      assert.equal(hasOverlap(rungs), false, `n=${n} seed=${seed}`);
    }
  }
});

test('불변식 2: 전체 매핑은 순열이다', () => {
  for (const n of NS) {
    for (const seed of SEEDS) {
      const rungs = generateRungs(n, defaultRowCount(n), { rng: seed });
      assert.equal(isPermutation(computeMapping(n, rungs)), true, `n=${n} seed=${seed}`);
    }
  }
});

test('불변식 3: 당첨 개수와 항목 멀티셋이 보존된다', () => {
  for (const n of NS) {
    for (const k of [1, Math.max(1, Math.floor(n / 2)), n]) {
      for (const seed of SEEDS) {
        const input = makeResults(n, k);
        const outcomes = shuffleResults(input, { rng: seed });
        assert.equal(
          outcomes.filter((o) => o.win).length,
          k,
          `n=${n} k=${k} seed=${seed}`,
        );
        assert.deepEqual(
          outcomes.map((o) => o.text).sort(),
          input.map((r) => r.text).sort(),
        );
      }
    }
  }
});

test('createGame: 시드 재현이 되고 불변식을 만족한다', () => {
  for (const n of NS) {
    const results = makeResults(n, 2);
    const a = createGame({ n, results, seed: 42 });
    const b = createGame({ n, results, seed: 42 });
    assert.deepEqual(a, b);
    assert.equal(isPermutation(a.mapping), true, `n=${n}`);
    assert.equal(hasOverlap(a.rungs), false, `n=${n}`);
    assert.deepEqual(
      a.outcomes.map((o) => o.text).sort(),
      results.map((r) => r.text).sort(),
    );
    assert.equal(
      a.outcomes.filter((o) => o.win).length,
      2,
      `n=${n}`,
    );
  }
});

test('getPath: 끝점이 trace 결과와 일치한다', () => {
  for (const n of NS) {
    const rungs = generateRungs(n, defaultRowCount(n), { rng: 5 });
    for (let s = 0; s < n; s++) {
      const path = getPath(rungs, s);
      const last = path[path.length - 1];
      assert.equal(last.pos, trace(rungs, s), `n=${n} s=${s}`);
      assert.equal(path[0].row, -1);
      assert.equal(path[0].pos, s);
    }
  }
});

test('경계값: 잘못된 입력은 에러를 던진다', () => {
  assert.throws(() => generateRungs(1, 4), /2명 이상/);
  assert.throws(() => createGame({ n: 1, results: makeResults(2) }), /2~16/);
  assert.throws(() => createGame({ n: 17, results: makeResults(17) }), /2~16/);
  assert.throws(() => createGame({ n: 4, results: makeResults(3) }), /개수/);
  assert.throws(() => shuffleResults([{ text: 'a', win: true }]), /2개 이상/);
  assert.throws(() => shuffleResults(makeResults(4, 0)), /최소 1개/);
  assert.throws(() => generateRungs(4, 0), /1~8/);
  assert.throws(() => generateRungs(4, 9), /1~8/);
});

test('행 수: 기본값은 항상 8단이다', () => {
  for (let n = 2; n <= 16; n++) {
    assert.equal(defaultRowCount(n), 8, `n=${n}`);
  }
});

test('generateRungs 옵션: minTotal을 채우고 정렬·겹침 금지를 유지한다', () => {
  for (const seed of SEEDS) {
    const rungs = generateRungs(8, 8, { rng: seed, density: 0.1, minTotal: 20 });
    assert.ok(rungs.length >= 20, `seed=${seed}`);
    assert.equal(hasOverlap(rungs), false, `seed=${seed}`);
    const sorted = [...rungs].sort((a, b) => a.row - b.row || a.left - b.left);
    assert.deepEqual(rungs, sorted);
  }
  for (const seed of SEEDS) {
    const rungs = generateRungs(4, 8, { rng: seed, density: 0 });
    assert.ok(rungs.length >= 8, `seed=${seed}`);
    assert.equal(hasOverlap(rungs), false, `seed=${seed}`);
  }
});

test('컬럼 연결수: 0~10 범위다', () => {
  for (const n of NS) {
    for (const seed of SEEDS) {
      const rungs = generateRungs(n, defaultRowCount(n), { rng: seed });
      for (const c of columnConnections(n, rungs)) {
        assert.ok(c >= 0 && c <= 10, `n=${n} seed=${seed}`);
      }
    }
  }
});
