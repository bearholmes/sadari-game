import { useReducer } from 'react';
import {
  firstUnusedFruit,
  fruitSrc,
  nextUnusedFruit,
  shuffledFruits,
} from '../fruits.ts';
import type { SetupConfig } from '../types.ts';
import type { ResultItem } from '../ladder.ts';

type Props = {
  onStart: (config: SetupConfig) => void;
};

type State = {
  n: number;
  names: string[];
  fruits: number[];
  k: number;
  prizes: string[];
  detail: boolean;
};

type Action =
  | { type: 'setN'; value: number }
  | { type: 'setK'; value: number }
  | { type: 'setName'; index: number; value: string }
  | { type: 'cycleFruit'; index: number }
  | { type: 'setPrize'; index: number; value: string }
  | { type: 'setDetail'; value: boolean };

function initState(): State {
  return {
    n: 4,
    names: ['', '', '', ''],
    fruits: shuffledFruits(4),
    k: 1,
    prizes: [''],
    detail: false,
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function resize<T>(prev: T[], len: number, fill: (i: number) => T): T[] {
  return Array.from({ length: len }, (_, i) => prev[i] ?? fill(i));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setN': {
      const n = clamp(action.value, 2, 16);
      const fruits = state.fruits.slice(0, n);
      const used = new Set(fruits);
      while (fruits.length < n) {
        const f = firstUnusedFruit(used);
        used.add(f);
        fruits.push(f);
      }
      const k = Math.min(state.k, n);
      return {
        ...state,
        n,
        names: resize(state.names, n, () => ''),
        fruits,
        k,
        prizes: resize(state.prizes, k, () => ''),
      };
    }
    case 'setK': {
      const k = clamp(action.value, 1, state.n);
      return { ...state, k, prizes: resize(state.prizes, k, () => '') };
    }
    case 'setName':
      return {
        ...state,
        names: state.names.map((v, j) => (j === action.index ? action.value : v)),
      };
    case 'cycleFruit': {
      const used = new Set(state.fruits);
      return {
        ...state,
        fruits: state.fruits.map((f, j) => (j === action.index ? nextUnusedFruit(used, f) : f)),
      };
    }
    case 'setPrize':
      return {
        ...state,
        prizes: state.prizes.map((t, j) => (j === action.index ? action.value : t)),
      };
    case 'setDetail':
      return { ...state, detail: action.value };
  }
}

export default function SetupForm({ onStart }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { n, names, fruits, k, prizes, detail } = state;

  const start = () => {
    const results: ResultItem[] = [
      ...prizes.map((t, i) => ({ text: t.trim() || `내용 ${i + 1}`, win: true })),
      ...Array.from({ length: n - k }, () => ({ text: '', win: false })),
    ];
    onStart({
      n,
      names: names.map((t, i) => t.trim() || `참가자 ${i + 1}`),
      fruits,
      results,
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
    >
      <section className="card">
        <div className="card-title">참가자 수</div>
        <div className="stepper">
          <button
            type="button"
            onClick={() => dispatch({ type: 'setN', value: n - 1 })}
            aria-label="참가자 줄이기"
          >
            −
          </button>
          <strong>{n}명</strong>
          <button
            type="button"
            onClick={() => dispatch({ type: 'setN', value: n + 1 })}
            aria-label="참가자 늘리기"
          >
            ＋
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-title">이름과 과일 말</div>
        <p className="card-sub">과일을 누르면 다른 과일로 바뀝니다</p>
        <div className="players">
          {names.map((t, i) => (
            <div key={i} className="player-row">
              <button
                type="button"
                className="fruit-pick"
                onClick={() => dispatch({ type: 'cycleFruit', index: i })}
                aria-label={`${i + 1}번 과일 바꾸기`}
              >
                <img src={fruitSrc(fruits[i])} alt="" />
              </button>
              <input
                value={t}
                maxLength={10}
                placeholder={`참가자 ${i + 1}`}
                onChange={(e) => dispatch({ type: 'setName', index: i, value: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title">당첨 수</div>
        <div className="stepper">
          <button
            type="button"
            onClick={() => dispatch({ type: 'setK', value: k - 1 })}
            aria-label="당첨 줄이기"
          >
            −
          </button>
          <strong>{k}개</strong>
          <button
            type="button"
            onClick={() => dispatch({ type: 'setK', value: k + 1 })}
            aria-label="당첨 늘리기"
          >
            ＋
          </button>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={detail}
            onChange={(e) => dispatch({ type: 'setDetail', value: e.target.checked })}
          />
          내용 직접 입력
        </label>
        {detail && (
          <div className="prize-inputs">
            {prizes.map((t, i) => (
              <input
                key={i}
                className="text-input"
                value={t}
                maxLength={12}
                placeholder={`내용 ${i + 1}`}
                onChange={(e) => dispatch({ type: 'setPrize', index: i, value: e.target.value })}
              />
            ))}
          </div>
        )}
      </section>

      <button type="submit" className="primary">
        사다리 만들기
      </button>
    </form>
  );
}
