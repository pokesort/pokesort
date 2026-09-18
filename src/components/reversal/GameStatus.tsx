import type { GameState } from "../../reversal/types";

interface GameStatusProps {
    game: GameState;
    playerId: string | null;
    restartGame: () => void;
}

export default function GameStatus({game,playerId,restartGame,}: GameStatusProps) {
    
    return (
        <>
            {game.status === "finished" && game.result && (
                <div>
                    {game.result.type === "draw" ? (
                        <p>Empate!</p>
                    ) : game.result.playerId === playerId ? (
                        <p>Você venceu!</p>
                    ) : (
                        <p>Você perdeu!</p>
                    )}
                </div>
            )}

            {game.status === "finished" && (
                <button onClick={restartGame}>
                    Jogar novamente
                </button>
            )}

            <p>Pokemons on board: {game.board.length}</p>
            <p>Pokemons on reserve: {game.reserve.length}</p>

            <div className="players">
                {game.players.map((player) => (
                    <p key={player.id}>
                        {player.name}: {player.score} pontos
                        {player.id === playerId && " (você)"}
                    </p>
                ))}
            </div>
        </>
    );
}