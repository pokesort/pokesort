import type { GameDifficult } from "../../models/types";

interface RoomSelectionProps {
    roomMode: "selection" | "public" | "private";
    setRoomMode: (mode: "selection" | "public" | "private") => void;
    searchingRoom: boolean;
    difficulty: GameDifficult | null;
    joinGame: (difficulty: GameDifficult) => void;
    cancelSearch: () => void;
    privateRoomStep: "selection" | "create" | "join" | "waiting";
    setPrivateRoomStep: (step: "selection" | "create" | "join" | "waiting") => void;
    privateRoomCode: string | null;
    createPrivateRoom: (difficulty: GameDifficult) => void;
    joinPrivateRoom: () => void;
    privateRoomJoinCode: string;
    setPrivateRoomJoinCode: (code: string) => void;
    privateRoomError: string | null;
    setPrivateRoomError: (error: string | null) => void;
}

export default function RoomSelection({
    roomMode,
    setRoomMode,
    searchingRoom,
    difficulty,
    joinGame,
    cancelSearch,
    privateRoomStep,
    privateRoomCode,
    createPrivateRoom,
    setPrivateRoomStep,
    privateRoomJoinCode,
    setPrivateRoomJoinCode,
    privateRoomError,
    joinPrivateRoom,
    setPrivateRoomError

}: RoomSelectionProps) {
    return (
        <div className="difficulty-selection">
            {roomMode === "selection" && (
                <>
                    <h1>Escolha o tipo de partida</h1>

                    <button onClick={() => setRoomMode("public")}>
                        Partida pública
                    </button>

                    <button onClick={() => setRoomMode("private")}>
                        Partida privada
                    </button>
                </>
            )}

            {roomMode === "public" && (
                <>
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
                </>
            )}

            {roomMode === "private" && (
                <>
                    {privateRoomStep === "selection" && (
                        <>
                            <h1>Partida privada</h1>

                            <button onClick={() => setPrivateRoomStep("create")}>
                                Criar sala
                            </button>

                            <button onClick={() => setPrivateRoomStep("join")}>
                                Entrar em sala
                            </button>
                        </>
                    )}

                    {privateRoomStep === "create" && (
                        <>
                            <h1>Escolha a dificuldade</h1>

                            <button onClick={() => createPrivateRoom("easy")}>
                                Pinsir X Heracross || Steven X Wallace
                                <span>24 Pokémon</span>
                            </button>

                            <button onClick={() => createPrivateRoom("medium")}>
                                Seviper X Zangoose || Gold X Silver
                                <span>32 Pokémon</span>
                            </button>

                            <button onClick={() => createPrivateRoom("hard")}>
                                Groudon X Kyogre || Archie X Maxie
                                <span>40 Pokémon</span>
                            </button>
                        </>
                    )}

                    {privateRoomStep === "join" && (
                        <>
                            <h1>Entrar em sala</h1>

                            <input
                                type="text"
                                value={privateRoomJoinCode}
                                onChange={(event) => {
                                    setPrivateRoomJoinCode(event.target.value.toUpperCase());
                                    setPrivateRoomError(null);
                                }}
                                placeholder="Código da sala"
                                maxLength={6}
                            />

                            <button
                                onClick={joinPrivateRoom}
                                disabled={privateRoomJoinCode.trim().length === 0}
                            >
                                Entrar
                            </button>

                            {privateRoomError && (
                                <p>{privateRoomError}</p>
                            )}
                        </>
                    )}

                    {privateRoomStep === "waiting" && (
                        <>
                            <h1>Aguardando jogador...</h1>

                            {privateRoomCode && (
                                <p>
                                    Código da sala: <strong>{privateRoomCode}</strong>
                                </p>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}