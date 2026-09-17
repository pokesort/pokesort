"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../reversal/types";
import { getCharacteristicPoints, getAllCharacteristicTypes, getCharacteristicOptions } from "../../models/types";
import type { ChallengeFieldType, GameDifficult, GuessCharacteristic } from "../../models/types";

import "@/src/styles/components/Reversal.css";

export default function Home() {
    const socketRef = useRef<WebSocket | null>(null);

    const [playerId, setPlayerId] = useState<string | null>(null);
    const [game, setGameState] = useState<GameState | null>(null);
    const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<GuessCharacteristic[]>([]);
    const [activeCharacteristic, setActiveCharacteristic] = useState<ChallengeFieldType | null>(null);
    const [guessResult, setGuessResult] = useState<{ valid: boolean; points: number; message: string } | null>(null);
    const [submittingGuess, setSubmittingGuess] = useState(false);
    const [swapRequestedBy, setSwapRequestedBy] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<GameDifficult | null>(null);
    const [searchingRoom, setSearchingRoom] = useState(false);

    useEffect(() => {
        const socket = new WebSocket("ws://192.168.10.101:3001");

        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Connected to WebSocket server");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "connected") setPlayerId(data.playerId);

            if (data.type === "gameStarted") {

                setGameState(data.game);
                setSearchingRoom(false);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                setGuessResult(null);
                setSubmittingGuess(false);
                setSwapRequestedBy([]);
            }

            if (data.type === "boardSwapStatus") setSwapRequestedBy(data.requestedBy);


            if (data.type === "guessResult") {
                console.log("GUESS RESULT RECEIVED:", data);

                setSubmittingGuess(false);

                setGuessResult({
                    valid: data.valid,
                    points: data.points,
                    message: data.message
                });

            }

            if (data.type === "gameStateUpdated") {
                setGameState(data.game);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                // setGuessResult(null)
            }

            if (data.type === "opponentLeft") {
                setGameState(null);
                setSearchingRoom(true);
                // setDifficulty(null);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                setGuessResult(null);
                setSubmittingGuess(false);
                setSwapRequestedBy([]);
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

    function cancelSearch() {
        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(JSON.stringify({
            type: "leaveRoom",
        }));

        setSearchingRoom(false);
        setDifficulty(null);
        // setSelectedPokemon([]);
        // setSelectedCharacteristics([]);
        // setActiveCharacteristic(null);
        // setGuessResult(null);
        // setSubmittingGuess(false);
        // setSwapRequestedBy([]);
    }

    function joinGame(selectedDifficulty: GameDifficult) {
        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open");
            return;
        }

        setDifficulty(selectedDifficulty);
        setSearchingRoom(true);
        setSelectedPokemon([]);
        setSelectedCharacteristics([]);
        setActiveCharacteristic(null);
        setGuessResult(null);
        setSubmittingGuess(false);
        setSwapRequestedBy([]);

        socket.send(
            JSON.stringify({
                type: "joinRoom",
                difficulty: selectedDifficulty,
            })
        );
    }

    function submitGuess() {

        if (submittingGuess) return;
        if (isWaitingForBoardSwap) return;

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

        if (isWaitingForBoardSwap) return;
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
        if (isWaitingForBoardSwap) return;

        selectCharacteristic({
            type: activeCharacteristic,
            value,
        });
    }

    function requestBoardSwap() {

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
        if (isWaitingForBoardSwap) return;
        if (game?.status !== "playing") return;

        setSelectedPokemon([]);
        setSelectedCharacteristics([]);
        setActiveCharacteristic(null);

        socketRef.current.send(
            JSON.stringify({
                type: "requestBoardSwap",
            })
        );
    }

    const selectedPoints = selectedCharacteristics.reduce(
        (total, characteristic) =>
            total + getCharacteristicPoints(characteristic),
        0
    );

    const isWaitingForBoardSwap = playerId
        ? swapRequestedBy.includes(playerId)
        : false;

    const activeCharacteristicOptions = activeCharacteristic
        ? getCharacteristicOptions(activeCharacteristic)
        : undefined;

    return (
        <main className="reversal-page">
            {/* Mudar o nome */}
            <h1>Reversal Mode</h1>

            {!game && (
                <div className="difficulty-selection">
                    {!searchingRoom ? (
                        <>
                            <h1>Escolha a dificuldade</h1>

                            <button onClick={() => joinGame("easy")}>
                                Pinsir X Heracross || Steven X Wallace
                                <span>24 Pokémon</span>
                            </button>

                            <button onClick={() => joinGame("medium")}>
                                Seviper X Zangoose || Gold X Silver
                                <span>32 Pokémon</span>
                            </button>

                            <button onClick={() => joinGame("hard")}>
                                Groudon X Kyogre || Archie X Maxie
                                <span>40 Pokémon</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <h1>Procurando jogador...</h1>
                            <p>Dificuldade: {difficulty}</p>

                            <button onClick={cancelSearch}>
                                Cancelar busca
                            </button>
                        </>
                    )}
                </div>
            )}

            {game && (
                <div>
                    <p>Dificuldade da Sala: {difficulty}</p>
                    <div>
                        <p>
                            {selectedPokemon.length < 4
                                ? "Selecione 4 pokemons"
                                : selectedCharacteristics.length === 0
                                    ? "Escolha as características"
                                    : `Palpite: ${selectedCharacteristics.length}/3`}
                        </p>
                    </div>

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
                    <p>Pokemons on reserve: {game.reserve.length}</p>
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
                                    disabled={submittingGuess || isWaitingForBoardSwap}
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
                                {getAllCharacteristicTypes().map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveCharacteristic(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {activeCharacteristic && (
                                <div className="characteristic-values">
                                    <h3>{activeCharacteristic}</h3>

                                    {(Array.isArray(activeCharacteristicOptions)) ? (
                                        activeCharacteristicOptions.map((value) => {

                                            const stringValue = String(value);

                                            const selected = selectedCharacteristics.some(
                                                (characteristic) =>
                                                    characteristic.type === activeCharacteristic &&
                                                    characteristic.value === value
                                            );

                                            return (
                                                <button
                                                    key={stringValue}
                                                    disabled={selected || selectedCharacteristics.length >= 3}
                                                    onClick={() => selectFieldValue(stringValue)}
                                                >
                                                    {stringValue}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        (() => {
                                            const { min, max } = activeCharacteristicOptions as { min: number; max: number };

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
                            onClick={requestBoardSwap}
                            disabled={isWaitingForBoardSwap || game.status != "playing"}
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
                                game?.status !== "playing" ||
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

                    {guessResult && (
                        <div className="guess-result">
                            <p>{guessResult.message}</p>
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
                                    disabled={submittingGuess || isWaitingForBoardSwap}
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