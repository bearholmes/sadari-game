import { useCallback, useState } from 'react';
import SetupForm from './components/SetupForm.tsx';
import PlayBoard from './components/PlayBoard.tsx';
import { createGame } from './ladder.ts';
import type { Game, SetupConfig } from './types.ts';

export default function App() {
  const [game, setGame] = useState<Game | null>(null);

  const start = useCallback((config: SetupConfig) => {
    const core = createGame(config);
    setGame({ ...config, ...core });
  }, []);

  const restart = useCallback(() => setGame(null), []);

  return (
    <main className="wrap">
      <header className="hero">
        <h1>사다리타기</h1>
        <p>과일을 고르고, 한 명씩 타고 내려가세요</p>
      </header>
      {game === null ? (
        <SetupForm onStart={start} />
      ) : (
        <PlayBoard game={game} onRestart={restart} />
      )}
    </main>
  );
}
