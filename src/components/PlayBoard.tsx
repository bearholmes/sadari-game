import { memo, useCallback, useMemo } from 'react';
import { fruitSrc } from '../fruits.ts';
import type { Game } from '../types.ts';
import type { Rung } from '../ladder.ts';
import { createLayout, trailPoints } from '../board/geometry.ts';
import { playerColor } from '../board/colors.ts';
import { usePlay } from '../board/usePlay.ts';

type Props = {
  game: Game;
  onRestart: () => void;
};

type Coord = (v: number) => number;

const LadderGrid = memo(function LadderGrid({
  columns,
  rungs,
  x,
  y,
  yBottom,
}: {
  columns: number[];
  rungs: Rung[];
  x: Coord;
  y: Coord;
  yBottom: number;
}) {
  return (
    <g>
      {columns.map((c) => (
        <line key={`v${c}`} x1={x(c)} y1={y(-1)} x2={x(c)} y2={yBottom} className="rail" />
      ))}
      {rungs.map((r, i) => (
        <line
          key={`r${i}`}
          x1={x(r.left)}
          y1={y(r.row)}
          x2={x(r.left + 1)}
          y2={y(r.row)}
          className="rung"
        />
      ))}
    </g>
  );
});

const PlayerToken = memo(function PlayerToken({
  s,
  name,
  fruit,
  color,
  dimmed,
  x,
  onTap,
}: {
  s: number;
  name: string;
  fruit: number;
  color: string;
  dimmed: boolean;
  x: Coord;
  onTap: (s: number) => void;
}) {
  return (
    <g
      onClick={() => onTap(s)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap(s);
        }
      }}
      className="player"
      role="button"
      tabIndex={0}
      aria-label={`${name} 타기 시작`}
    >
      <circle cx={x(s)} cy={30} r={25} className="avatar" stroke={color} />
      <image
        href={fruitSrc(fruit)}
        x={x(s) - 19}
        y={11}
        width={38}
        height={38}
        opacity={dimmed ? 0.55 : 1}
      />
      <text x={x(s)} y={74} textAnchor="middle" className="name">
        {dimmed ? `✓ ${name}` : name}
      </text>
    </g>
  );
});

const ResultSlot = memo(function ResultSlot({
  e,
  arrival,
  arrivalName,
  outcomeText,
  open,
  x,
  yBottom,
  onTap,
}: {
  e: number;
  arrival: number;
  arrivalName: string;
  outcomeText: string;
  open: boolean;
  x: Coord;
  yBottom: number;
  onTap: (s: number) => void;
}) {
  return (
    <g
      onClick={() => onTap(arrival)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap(arrival);
        }
      }}
      className="result-slot"
      role="button"
      tabIndex={0}
      aria-label={`${outcomeText || '결과'} 확인`}
    >
      <text x={x(e)} y={yBottom + 30} textAnchor="middle" className="result-text">
        {outcomeText}
      </text>
      {open && (
        <text x={x(e)} y={yBottom + 52} textAnchor="middle" className="arrival">
          {arrivalName}
        </text>
      )}
    </g>
  );
});

export default function PlayBoard({ game, onRestart }: Props) {
  const { n, names, fruits, rungs, rowCount, mapping, outcomes } = game;
  const layout = useMemo(() => createLayout(n, rowCount), [n, rowCount]);
  const { x, y, yBottom, width, height } = layout;
  const columns = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
  const colors = useMemo(
    () => Array.from({ length: n }, (_, i) => playerColor(i, n)),
    [n],
  );
  const arrivalOf = useMemo(() => {
    const inv = new Array<number>(n);
    mapping.forEach((e, s) => {
      inv[e] = s;
    });
    return inv;
  }, [mapping, n]);
  const isWinner = useCallback(
    (s: number) => outcomes[mapping[s]].win,
    [outcomes, mapping],
  );
  const { revealed, trails, active, step, path, tap, revealAll, doneCount, allDone } = usePlay({
    n,
    rungs,
    isWinner,
  });
  const doneTrails = useMemo(
    () =>
      Object.entries(trails).map(([s, p]) => ({
        s: Number(s),
        d: trailPoints(p, x, y, yBottom, -1),
      })),
    [trails, x, y, yBottom],
  );
  const activeTrail = useMemo(
    () => (active === null || path.length === 0 ? '' : trailPoints(path, x, y, yBottom, step)),
    [active, path, step, x, y, yBottom],
  );
  const head = useMemo(
    () => (path.length === 0 ? null : path[Math.min(step, path.length - 1)]),
    [path, step],
  );

  return (
    <div>
      <div className="toolbar">
        <span>
          {doneCount}/{n}명 공개
        </span>
        {!allDone && (
          <button type="button" onClick={revealAll}>
            전체 확인
          </button>
        )}
        <button type="button" onClick={onRestart}>
          처음부터
        </button>
      </div>

      <p className="hint">과일이나 결과를 눌러 타기 시작하세요. 전체 확인은 당첨 라인만 그립니다.</p>

      <div className="board">
        <svg width={width} height={height} role="img" aria-label="사다리">
          <LadderGrid columns={columns} rungs={rungs} x={x} y={y} yBottom={yBottom} />
          {doneTrails.map(({ s, d }) => (
            <polyline key={`t${s}`} points={d} className="trail-done" stroke={colors[s]} />
          ))}
          {activeTrail && (
            <polyline points={activeTrail} className="trail-active" stroke={colors[active ?? 0]} />
          )}
          {names.map((name, s) => (
            <PlayerToken
              key={`p${s}`}
              s={s}
              name={name}
              fruit={fruits[s]}
              color={colors[s]}
              dimmed={revealed[s]}
              x={x}
              onTap={tap}
            />
          ))}
          {active !== null && head && (
            <g>
              <circle
                cx={x(head.pos)}
                cy={y(head.row)}
                r={21}
                className="head-ring"
                stroke={colors[active]}
              />
              <image
                href={fruitSrc(fruits[active])}
                x={x(head.pos) - 17}
                y={y(head.row) - 17}
                width={34}
                height={34}
              />
            </g>
          )}
          {columns.map((e) => {
            const s = arrivalOf[e];
            return (
              <ResultSlot
                key={`f${e}`}
                e={e}
                arrival={s}
                arrivalName={names[s]}
                outcomeText={outcomes[e].text}
                open={revealed[s]}
                x={x}
                yBottom={yBottom}
                onTap={tap}
              />
            );
          })}
        </svg>
      </div>

      {allDone && (
        <div className="result">
          <h2>결과 발표</h2>
          <ul className="result-list">
            {names.map((name, s) => (
              <li key={s}>
                <span className="dot" style={{ background: colors[s] }} />
                {name} → {outcomes[mapping[s]].text || '—'}
              </li>
            ))}
          </ul>
          <button type="button" className="primary" onClick={onRestart}>
            다시 하기
          </button>
        </div>
      )}
    </div>
  );
}
