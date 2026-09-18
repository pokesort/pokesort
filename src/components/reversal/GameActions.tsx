import type { GuessCharacteristic } from "../../models/types";
import type { GameState } from "../../reversal/types";


interface GameActionsProps {
    game: GameState;
    selectedPokemon: number[];
    selectedCharacteristics: GuessCharacteristic[];
    submittingGuess: boolean;
    isWaitingForBoardSwap: boolean;
    selectedPoints: number;
    requestBoardSwap: () => void;
    submitGuess: () => void;
}

export default function GameActions({
    game,
    selectedPokemon,
    selectedCharacteristics,
    submittingGuess,
    isWaitingForBoardSwap,
    selectedPoints,
    requestBoardSwap,
    submitGuess,
}: GameActionsProps) {
    return (
        <div className="game-actions">
            <button
                onClick={requestBoardSwap}
                disabled={isWaitingForBoardSwap || game.status !== "playing"}
            >
                {isWaitingForBoardSwap
                    ? "Aguardando outro jogador..."
                    : "Trocar tabuleiro"}
            </button>

            <button
                disabled={
                    selectedPokemon.length !== 4 ||
                    selectedCharacteristics.length < 1 ||
                    submittingGuess ||
                    game.status !== "playing" ||
                    isWaitingForBoardSwap
                }
                onClick={submitGuess}
            >
                {submittingGuess
                    ? "Enviando..."
                    : "Enviar palpite"}
            </button>

            {selectedCharacteristics.length > 0 && (
                <span>
                    Possíveis pontos: {selectedPoints}
                </span>
            )}
        </div>
    );
}