import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRUIT_COUNT,
  firstUnusedFruit,
  fruitSrc,
  nextUnusedFruit,
  shuffledFruits,
} from '../src/fruits.ts';

test('fruitSrc: 기본 base 경로의 webp 에셋을 가리킨다', () => {
  assert.equal(fruitSrc(0), '/fruits/fruit-00.webp');
  assert.equal(fruitSrc(15), '/fruits/fruit-15.webp');
});

test('과일 선택: 중복 없이 n개를 고른다', () => {
  for (const n of [2, 4, 16]) {
    const picked = shuffledFruits(n);
    assert.equal(picked.length, n);
    assert.equal(new Set(picked).size, n);
    assert.ok(picked.every((i) => i >= 0 && i < FRUIT_COUNT));
  }
});

test('미사용 과일 탐색: 처음·다음 빈 슬롯을 찾는다', () => {
  assert.equal(firstUnusedFruit(new Set([0, 1, 2])), 3);
  assert.equal(nextUnusedFruit(new Set([1]), 0), 2);
  const allButZero = new Set(Array.from({ length: FRUIT_COUNT - 1 }, (_, i) => i + 1));
  assert.equal(nextUnusedFruit(allButZero, 5), 0);
});
