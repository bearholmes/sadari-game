import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { getPath } from '../ladder.ts';
import type { PathPoint, Rung } from '../ladder.ts';
import { BOARD } from './geometry.ts';

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

type Args = {
  n: number;
  rungs: Rung[];
  isWinner: (s: number) => boolean;
};

export function usePlay({ n, rungs, isWinner }: Args) {
  const [revealed, setRevealed] = useState<boolean[]>(() => new Array<boolean>(n).fill(false));
  const [trails, setTrails] = useState<Record<number, PathPoint[]>>({});
  const [active, setActive] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  const path = useMemo<PathPoint[]>(
    () => (active === null ? [] : getPath(rungs, active)),
    [active, rungs],
  );

  useEffect(() => {
    if (active === null) return undefined;
    if (reduceMotion) {
      setTrails({ [active]: getPath(rungs, active) });
      setRevealed((prev) => prev.map((v, i) => (i === active ? true : v)));
      setActive(null);
      return undefined;
    }
    if (step >= path.length - 1) {
      const t = setTimeout(() => {
        setTrails({ [active]: path });
        setRevealed((prev) => prev.map((v, i) => (i === active ? true : v)));
        setActive(null);
        setStep(0);
      }, BOARD.stepMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), BOARD.stepMs);
    return () => clearTimeout(t);
  }, [active, step, path, rungs, reduceMotion]);

  const tap = useCallback(
    (i: number) => {
      if (active !== null && i === active) {
        setTrails({ [i]: path });
        setRevealed((prev) => prev.map((v, j) => (j === i ? true : v)));
        setActive(null);
        setStep(0);
        return;
      }
      setTrails({});
      setActive(i);
      setStep(0);
    },
    [active, path],
  );

  const revealAll = useCallback(() => {
    const next: Record<number, PathPoint[]> = {};
    for (let s = 0; s < n; s++) {
      if (isWinner(s)) next[s] = getPath(rungs, s);
    }
    setTrails(next);
    setRevealed(new Array<boolean>(n).fill(true));
    setActive(null);
    setStep(0);
  }, [n, rungs, isWinner]);

  const doneCount = useMemo(() => revealed.filter(Boolean).length, [revealed]);

  return {
    revealed,
    trails,
    active,
    step,
    path,
    tap,
    revealAll,
    doneCount,
    allDone: doneCount === n,
  };
}
