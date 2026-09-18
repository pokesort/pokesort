import type { GameDifficult } from "../../models/types";

interface RoomSelectionProps {
    roomMode: "selection" | "public" | "private";
    setRoomMode: (mode: "selection" | "public" | "private") => void;
    searchingRoom: boolean;
    difficulty: GameDifficult | null;
    joinGame: (difficulty: GameDifficult) => void;
    cancelSearch: () => void;
}

export default function RoomSelection({
    roomMode,
    setRoomMode,
    searchingRoom,
    difficulty,
    joinGame,
    cancelSearch,
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
                    <h1>Partida privada</h1>

                    <button>
                        Criar sala
                    </button>

                    <button>
                        Entrar em sala
                    </button>
                </>
            )}
        </div>
    );
}