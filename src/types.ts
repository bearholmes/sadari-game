import type { GameCore, ResultItem } from './ladder.ts';

export type Game = GameCore & { names: string[]; fruits: number[] };

export type SetupConfig = {
  n: number;
  names: string[];
  fruits: number[];
  results: ResultItem[];
};
