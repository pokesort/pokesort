"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../reversal/types";
import type { GuessCharacteristic, CharacteristicType } from "../../models/types";

import { CHARACTERISTIC_DEFINITIONS } from "../../models/types";
import { FIELD_OPTIONS } from "../../scripts/utils";

import "@/src/styles/components/Reversal.css";

export default function Home() {
    const socketRef = useRef<WebSocket | null>(null);

    const [playerId, setPlayerId] = useState<string | null>(null);
    const [game, setGameState] = useState<GameState | null>(null);
    const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<GuessCharacteristic[]>([]);
    const [activeCharacteristic, setActiveCharacteristic] = useState<CharacteristicType | null>(null);
    const [guessResult, setGuessResult] = useState<{ valid: boolean; points: number; } | null>(null);
    const [submittingGuess, setSubmittingGuess] = useState(false);

    useEffect(() => {
        const socket = new WebSocket("ws://192.168.10.101:3001");

        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Connected to WebSocket server");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            console.log("Message from server:", data);

            if (data.type === "connected") setPlayerId(data.playerId);

            if (data.type === "gameStarted") setGameState(data.game);

            if (data.type === "guessResult") {
                console.log("GUESS RESULT RECEIVED:", data);

                setSubmittingGuess(false);

                setGuessResult({
                    valid: data.valid,
                    points: data.points,
                });

            }

            if (data.type === "gameStateUpdated") {
                console.log("Game state updated:", data.game);
                setGameState(data.game);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                // setGuessResult(null);
            }

            if (data.type === "opponentLeft") {
                console.log("Opponent left the game");
                setGameState(null);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
            }
        };

        socket.onclose = () => {
            //tratar reconexão, se possível
            console.log("Disconnected from WebSocket server");

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };

        return () => {
            socket.close();
            socketRef.current = null;
        };
    }, []);

    function submitGuess() {

        console.log("submitGuess called");
        if (submittingGuess) return;

        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open");
            return;
        }

        if (selectedPokemon.length !== 4) {
            console.log("Need exactly 4 pokemons selected to submit a guess");
            return;
        }

        setSubmittingGuess(true);
        console.log("Sending submitGuess:", selectedPokemon);

        socket.send(
            JSON.stringify({
                type: "submitGuess",
                elements: selectedPokemon,
                characteristics: selectedCharacteristics
            })
        );
    }

    function restartGame() {
        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open");
            return;
        }

        socket.send(
            JSON.stringify({
                type: "restartGame",
            })
        );
    }

    function selectCharacteristic(characteristic: GuessCharacteristic) {

        if (selectedCharacteristics.length >= 3) return;

        const alreadySelected = selectedCharacteristics.some(
            (current) =>
                current.type === characteristic.type &&
                current.value === characteristic.value
        );

        if (alreadySelected) return;

        setSelectedCharacteristics((current) => [
            ...current,
            characteristic,
        ]);
    }

    function selectFieldValue(value: string) {
        if (!activeCharacteristic) return;
        if (submittingGuess) return;

        selectCharacteristic({
            type: activeCharacteristic,
            value,
        });
    }

    return (
        <main className="reversal-page">
            {/* Mudar o nome */}
            <h1>Reversal Mode</h1>

            <div>
                <p>
                    {selectedPokemon.length < 4
                        ? "Selecione 4 pokemons"
                        : selectedCharacteristics.length === 0
                            ? "Escolha as características"
                            : `Palpite: ${selectedCharacteristics.length}/3`}
                </p>
            </div>

            {game && (
                <div>
                    {/* <p>Game status: {game.status}</p> */}

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
                    {game?.status === "finished" && (
                        <button onClick={restartGame}>
                            Jogar novamente
                        </button>
                    )}
                    <p>Pokemons on board: {game.board.length}</p>
                    <div className="players">
                        {game.players.map((player) => (
                            <p key={player.id}>
                                {player.name}: {player.score} pontos
                                {player.id === playerId && " (você)"}
                            </p>
                        ))}
                    </div>

                    <div className="pokemon-grid">
                        {game.board.map((pokemon) => {
                            const selected = selectedPokemon.includes(pokemon.id);

                            return (
                                <button
                                    key={pokemon.id}
                                    className={selected ? "pokemon-card selected" : "pokemon-card"}
                                    onClick={() => {

                                        if (game.status !== "playing") return;
                                        if (submittingGuess) return;

                                        if (selected) {
                                            setSelectedPokemon((current) =>
                                                current.filter((id) => id !== pokemon.id)
                                            );

                                            //Ao remover pokemon, também removemos as características selecionadas e o activeCharacteristic
                                            setSelectedCharacteristics([]);
                                            setActiveCharacteristic(null);

                                            return;
                                        }

                                        if (selectedPokemon.length >= 4) {
                                            return;
                                        }

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

                    {selectedPokemon.length === 4 && (
                        <div className="characteristics">
                            <h2>Características</h2>

                            <div className="characteristic-types">
                                {Object.keys(CHARACTERISTIC_DEFINITIONS).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() =>
                                            setActiveCharacteristic(
                                                type as CharacteristicType
                                            )
                                        }
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {activeCharacteristic && (
                                <div className="characteristic-values">
                                    <h3>{activeCharacteristic}</h3>

                                    {Array.isArray(FIELD_OPTIONS[activeCharacteristic]) ? (
                                        FIELD_OPTIONS[activeCharacteristic].map((value) => {
                                            const selected = selectedCharacteristics.some(
                                                (characteristic) =>
                                                    characteristic.type === activeCharacteristic &&
                                                    characteristic.value === value
                                            );

                                            return (
                                                <button
                                                    key={value}
                                                    disabled={selected || selectedCharacteristics.length >= 3}
                                                    onClick={() => selectFieldValue(value)}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        (() => {
                                            const { min, max } =
                                                FIELD_OPTIONS[activeCharacteristic];

                                            const amount = max - min + 1;

                                            if (amount <= 20) {
                                                return Array.from(
                                                    { length: amount },
                                                    (_, index) => String(min + index)
                                                ).map((value) => {
                                                    const selected = selectedCharacteristics.some(
                                                        (characteristic) =>
                                                            characteristic.type === activeCharacteristic &&
                                                            characteristic.value === value
                                                    );

                                                    return (
                                                        <button
                                                            key={value}
                                                            disabled={
                                                                selected ||
                                                                selectedCharacteristics.length >= 3
                                                            }
                                                            onClick={() => selectFieldValue(value)}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                });
                                            }

                                            return (
                                                <div>
                                                    <input
                                                        type="number"
                                                        min={min}
                                                        max={max}
                                                        placeholder={`${min} - ${max}`}
                                                        onKeyDown={(event) => {
                                                            if (event.key !== "Enter") return;

                                                            const value = event.currentTarget.value;

                                                            if (!value) return;

                                                            const numericValue = Number(value);

                                                            if (
                                                                numericValue < min ||
                                                                numericValue > max
                                                            ) {
                                                                return;
                                                            }

                                                            selectFieldValue(value);
                                                            event.currentTarget.value = "";
                                                        }}
                                                    />

                                                    <p>
                                                        Digite um valor entre {min} e {max} e pressione
                                                        Enter.
                                                    </p>
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <p>
                        Selected: {selectedPokemon.length}/4
                    </p>

                    <div className="game-actions">
                        <button
                            disabled={
                                selectedPokemon.length !== 4 ||
                                selectedCharacteristics.length < 1 ||
                                submittingGuess ||
                                game?.status !== "playing"
                            }
                            onClick={submitGuess}
                        >
                            {submittingGuess
                                ? "Enviando..."
                                : "Enviar palpite"}
                        </button>
                    </div>

                    {guessResult && (
                        <div className="guess-result">
                            {guessResult.valid ? (
                                <p>
                                    Palpite correto! +{guessResult.points} pontos.
                                </p>
                            ) : (
                                <p>
                                    Palpite inválido.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="selected-characteristics">
                        <p>
                            Características selecionadas:{" "}
                            {selectedCharacteristics.length}/3
                        </p>

                        {selectedCharacteristics.map((characteristic, index) => (
                            <p key={index} className="selected-characteristic">
                                {characteristic.type}: {characteristic.value}
                                <button
                                    onClick={() => {
                                        if (submittingGuess) return;

                                        setSelectedCharacteristics((current) =>
                                            current.filter((_, currentIndex) => currentIndex !== index)
                                        );
                                    }}
                                >
                                    Remover
                                </button>
                            </p>
                        ))}
                    </div>

                    <p>
                        Player ID: {playerId ?? "connecting..."}
                    </p>
                </div>
            )}
        </main>
    );
}