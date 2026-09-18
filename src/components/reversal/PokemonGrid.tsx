import type { Dispatch, SetStateAction } from "react";

import type { GameState } from "../../reversal/types";
import type { ChallengeFieldType, GuessCharacteristic } from "../../models/types";

interface PokemonGridProps {
    game: GameState;
    selectedPokemon: number[];
    setSelectedPokemon: Dispatch<SetStateAction<number[]>>;
    setSelectedCharacteristics: Dispatch<SetStateAction<GuessCharacteristic[]>>;
    setActiveCharacteristic: Dispatch<SetStateAction<ChallengeFieldType | null>>;
    setGuessResult: Dispatch<
        SetStateAction<{
            valid: boolean;
            points: number;
            message: string;
        } | null>
    >;
    submittingGuess: boolean;
    isWaitingForBoardSwap: boolean;
}

export default function PokemonGrid({
    game,
    selectedPokemon,
    setSelectedPokemon,
    setSelectedCharacteristics,
    setActiveCharacteristic,
    setGuessResult,
    submittingGuess,
    isWaitingForBoardSwap,
}: PokemonGridProps) {
    return (
        <div className="pokemon-grid">
            {game.board.map((pokemon) => {
                const selected = selectedPokemon.includes(pokemon.id);

                return (
                    <button
                        key={pokemon.id}
                        className={selected ? "pokemon-card selected" : "pokemon-card"}
                        disabled={submittingGuess || isWaitingForBoardSwap}
                        onClick={() => {
                            if (game.status !== "playing") return;
                            if (submittingGuess) return;

                            if (selected) {
                                setSelectedPokemon((current) =>
                                    current.filter((id) => id !== pokemon.id)
                                );

                                // Ao remover Pokémon, também removemos as características selecionadas e o activeCharacteristic
                                setSelectedCharacteristics([]);
                                setActiveCharacteristic(null);
                                return;
                            }

                            if (selectedPokemon.length >= 4) return;

                            setGuessResult(null);

                            setSelectedPokemon((current) => [
                                ...current,
                                pokemon.id,
                            ]);
                        }}
                    >
                        {pokemon.name}
                    </button>
                );
            })}
        </div>
    );
}