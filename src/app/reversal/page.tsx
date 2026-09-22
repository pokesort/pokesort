"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../reversal/types";
import { getCharacteristicPoints, getAllCharacteristicTypes, getCharacteristicOptions } from "../../models/types";
import type { ChallengeFieldType, GameDifficult, GuessCharacteristic } from "../../models/types";

import RoomSelection from "../../components/reversal/RoomSelection";
import PokemonGrid from "@/src/components/reversal/PokemonGrid";
import GameActions from "@/src/components/reversal/GameActions";

import "@/src/styles/components/Reversal.css";
import GameStatus from "@/src/components/reversal/GameStatus";

export default function Home() {
    const socketRef = useRef<WebSocket | null>(null);

    const [playerId, setPlayerId] = useState<string | null>(null);
    const [game, setGameState] = useState<GameState | null>(null);
    const [searchingRoom, setSearchingRoom] = useState(false);
    const [difficulty, setDifficulty] = useState<GameDifficult | null>(null);

    const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<GuessCharacteristic[]>([]);
    const [activeCharacteristic, setActiveCharacteristic] = useState<ChallengeFieldType | null>(null);

    const [guessResult, setGuessResult] = useState<{ valid: boolean; points: number; message: string } | null>(null);
    const [submittingGuess, setSubmittingGuess] = useState(false);
    const [swapRequestedBy, setSwapRequestedBy] = useState<string[]>([]);

    const [roomMode, setRoomMode] = useState<"selection" | "public" | "private">("selection");
    const roomModeRef = useRef<"selection" | "public" | "private">("selection");
    const [privateRoomStep, setPrivateRoomStep] = useState<"selection" | "create" | "join" | "waiting">("selection");
    const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
    const [privateRoomJoinCode, setPrivateRoomJoinCode] = useState("");
    const [privateRoomError, setPrivateRoomError] = useState<string | null>(null);

    useEffect(() => {
        roomModeRef.current = roomMode;
    }, [roomMode])

    useEffect(() => {
        const socket = new WebSocket("ws://10.88.154.87:3001");

        socketRef.current = socket;

        socket.onopen = () => {

            const playerId = sessionStorage.getItem("playerId");
            const reconnectToken = sessionStorage.getItem("reconnectToken");

            if (playerId && reconnectToken) {
                socket.send(JSON.stringify({
                    type: "reconnect",
                    playerId,
                    reconnectToken,
                }));

                return;
            }
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "reconnected") {
                setGameState(data.game);
                setDifficulty(data.difficulty);
                setSearchingRoom(false);

                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                setGuessResult(null);
                setSubmittingGuess(false);
                setSwapRequestedBy([]);

                return;
            }

            if (data.type === "connected") {

                setPlayerId(data.playerId);

                //Usado para testar entre abas, trocar para LocalStorage
                sessionStorage.setItem("playerId", data.playerId);
                sessionStorage.setItem("reconnectToken", data.reconnectToken);
            }

            if (data.type === "gameStarted") {

                setGameState(data.game);
                setDifficulty(data.difficulty)
                setSearchingRoom(false);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                setGuessResult(null);
                setSubmittingGuess(false);
                setSwapRequestedBy([]);
            }

            if (data.type == "privateRoomCreated") setPrivateRoomCode(data.code);

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

                console.log("opponentLeft - roomMode:", roomModeRef);

                if (roomModeRef.current === "private") {
                    socketRef.current?.send(JSON.stringify({
                        type: "leaveRoom",
                    }));

                    setPrivateRoomStep("selection");
                    setPrivateRoomCode(null);
                    setPrivateRoomJoinCode("");
                    setPrivateRoomError(null);
                    setSearchingRoom(false);
                } else {
                    setSearchingRoom(true);
                }

                setGameState(null);
                setSelectedPokemon([]);
                setSelectedCharacteristics([]);
                setActiveCharacteristic(null);
                setGuessResult(null);
                setSubmittingGuess(false);
                setSwapRequestedBy([]);
            }

            if (data.type === "privateRoomJoinFailed") setPrivateRoomError(data.message);
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

    function createPrivateRoom(selectedDifficulty: GameDifficult) {
        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open");
            return;
        }

        setDifficulty(selectedDifficulty);
        setPrivateRoomCode(null);
        setPrivateRoomStep("waiting");

        socket.send(JSON.stringify({
            type: "createPrivateRoom",
            difficulty: selectedDifficulty,
        }));
    }

    function joinPrivateRoom() {
        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket is not open");
            return;
        }

        const code = privateRoomJoinCode.trim().toUpperCase();

        if (!code) return;

        setPrivateRoomError(null);

        socket.send(JSON.stringify({
            type: "joinPrivateRoom",
            code,
        }));
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
                <RoomSelection
                    roomMode={roomMode}
                    setRoomMode={setRoomMode}
                    searchingRoom={searchingRoom}
                    difficulty={difficulty}
                    joinGame={joinGame}
                    cancelSearch={cancelSearch}
                    privateRoomStep={privateRoomStep}
                    privateRoomCode={privateRoomCode}
                    createPrivateRoom={createPrivateRoom}
                    setPrivateRoomStep={setPrivateRoomStep}
                    privateRoomJoinCode={privateRoomJoinCode}
                    setPrivateRoomJoinCode={setPrivateRoomJoinCode}
                    privateRoomError={privateRoomError}
                    setPrivateRoomError={setPrivateRoomError}
                    joinPrivateRoom={joinPrivateRoom}
                />
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

                    <GameStatus game={game} playerId={playerId} restartGame={restartGame} />

                    <PokemonGrid
                        game={game}
                        selectedPokemon={selectedPokemon}
                        setSelectedPokemon={setSelectedPokemon}
                        setSelectedCharacteristics={setSelectedCharacteristics}
                        setActiveCharacteristic={setActiveCharacteristic}
                        setGuessResult={setGuessResult}
                        submittingGuess={submittingGuess}
                        isWaitingForBoardSwap={isWaitingForBoardSwap}
                    />

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

                    <GameActions
                        game={game}
                        selectedPokemon={selectedPokemon}
                        selectedCharacteristics={selectedCharacteristics}
                        submittingGuess={submittingGuess}
                        isWaitingForBoardSwap={isWaitingForBoardSwap}
                        selectedPoints={selectedPoints}
                        requestBoardSwap={requestBoardSwap}
                        submitGuess={submitGuess}
                    />

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