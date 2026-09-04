
"use client";

import { useState } from "react";
import { FIELD_OPTIONS } from "../../scripts/utils";

export default function TestPuzzle() {
    const [puzzle, setPuzzle] = useState(null);

    const [queryKey, setQueryKey] = useState("");
    const [queryValue, setQueryValue] = useState("");

    const [usedFields, setUsedFields] = useState({});

    const [loading, setLoading] = useState(false);

    const [guess, setGuess] = useState("");
    const [guessResult, setGuessResult] = useState(null);

    async function generatePuzzle() {
        setLoading(true);

        try {
            const response = await fetch("/api/pokewho/get", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Erro ao gerar puzzle");
            }

            const data = await response.json();

            setPuzzle(data);

            // Limpa o estado das perguntas do puzzle anterior
            setUsedFields({});
            setQueryKey("");
            setQueryValue("");
            setGuess("");
            setGuessResult(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function sendQuery() {
        if (!puzzle || !queryKey || !queryValue) {
            return;
        }

        // Impede reutilizar um campo já utilizado
        if (usedFields[queryKey] !== undefined) {
            return;
        }

        const query = {
            [queryKey]: queryValue,
        };

        try {
            const response = await fetch("/api/pokewho/question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secretId: puzzle.secretId,
                    pokemons: puzzle.pokemons,
                    query,
                }),
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar pergunta");
            }

            const data = await response.json();

            setPuzzle(data);

            // Registra o campo e o valor utilizados
            setUsedFields((current) => ({
                ...current,
                [queryKey]: queryValue,
            }));

            // Limpa a seleção atual
            setQueryKey("");
            setQueryValue("");
        } catch (error) {
            console.error(error);
        }
    }

    function selectQueryKey(key) {
        // Campos já utilizados não podem ser selecionados
        if (usedFields[key] !== undefined) {
            return;
        }

        setQueryKey(key);
        setQueryValue("");
    }

    function confirmGuess() {
        if (!puzzle || !guess.trim()) {
            return;
        }

        const guessedPokemon = puzzle.pokemons.find(
            (pokemon) =>
                pokemon.name.toLowerCase() === guess.trim().toLowerCase()
        );

        if (guessedPokemon?.id === puzzle.secretId) {
            setGuessResult(true);
        } else {
            setGuessResult(false);
        }
    }

    const fieldKeys = Object.keys(FIELD_OPTIONS);

    return (
        <div style={styles.container}>
            <button
                onClick={generatePuzzle}
                disabled={loading}
                style={styles.generateButton}
            >
                {loading ? "Gerando..." : "Gerar puzzle"}
            </button>

            {puzzle && (
                <div style={styles.gameContainer}>
                    <div style={styles.mainContent}>
                        {/* Lista de campos */}
                        <div style={styles.fieldsContainer}>
                            <div style={styles.fieldsHeader}>
                                <div>Chave</div>
                                <div>Valor</div>
                            </div>

                            {fieldKeys.map((key) => {
                                const used = usedFields[key] !== undefined;
                                const selected = queryKey === key;

                                return (
                                    <div
                                        key={key}
                                        onClick={() => selectQueryKey(key)}
                                        style={{
                                            ...styles.fieldRow,
                                            ...(used
                                                ? styles.usedField
                                                : styles.availableField),
                                            ...(selected
                                                ? styles.selectedField
                                                : {}),
                                        }}
                                    >
                                        <div style={styles.fieldKey}>
                                            {key}
                                        </div>

                                        <div style={styles.fieldValue}>
                                            {used
                                                ? usedFields[key]
                                                : selected
                                                  ? "Selecionado"
                                                  : ""}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Área principal */}
                        <div style={styles.gameArea}>
                            <div style={styles.grid}>
                                {puzzle.pokemons.map((pokemon) => (
                                    <div
                                        key={pokemon.id}
                                        style={{
                                            ...styles.pokemon,
                                            opacity: pokemon.available
                                                ? 1
                                                : 0.25,
                                        }}
                                    >
                                        {pokemon.name}
                                    </div>
                                ))}
                            </div>

                            {/* Pergunta */}
                            <div style={styles.queryContainer}>
                                <input
                                    type="text"
                                    placeholder="Chave"
                                    value={queryKey}
                                    readOnly
                                    style={{
                                        ...styles.input,
                                        backgroundColor: "#f5f5f5",
                                    }}
                                />

                                <input
                                    type="text"
                                    placeholder="Valor"
                                    value={queryValue}
                                    onChange={(e) =>
                                        setQueryValue(e.target.value)
                                    }
                                    style={styles.input}
                                    disabled={!queryKey}
                                />

                                <button
                                    onClick={sendQuery}
                                    disabled={!queryKey || !queryValue}
                                    style={styles.queryButton}
                                >
                                    Enviar pergunta
                                </button>
                            </div>

                            {/* Palpite */}
                            <div style={styles.guessContainer}>
                                <input
                                    type="text"
                                    placeholder="Nome do Pokémon"
                                    value={guess}
                                    onChange={(e) =>
                                        setGuess(e.target.value)
                                    }
                                    style={styles.input}
                                />

                                <button
                                    onClick={confirmGuess}
                                    style={styles.queryButton}
                                >
                                    Confirmar palpite
                                </button>
                            </div>

                            {guessResult !== null && (
                                <div>
                                    {guessResult ? "Acertou!" : "Errou!"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#242424",
        color: "#eee",
    },

    generateButton: {
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#333",
        color: "#eee",
        border: "1px solid #555",
        borderRadius: "4px",
    },

    gameContainer: {
        display: "flex",
        width: "900px",
    },

    mainContent: {
        display: "flex",
        gap: "30px",
        alignItems: "flex-start",
    },

    fieldsContainer: {
        width: "240px",
        border: "1px solid #555",
        borderRadius: "5px",
        overflow: "hidden",
        backgroundColor: "#2d2d2d",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    },

    fieldsHeader: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        fontWeight: "bold",
        borderBottom: "1px solid #555",
        backgroundColor: "#383838",
        color: "#ddd",
    },

    fieldRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "38px",
        alignItems: "center",
        borderBottom: "1px solid #444",
        cursor: "pointer",
        transition: "opacity 0.2s, background-color 0.2s",
    },

    fieldKey: {
        padding: "8px",
        fontSize: "14px",
    },

    fieldValue: {
        padding: "8px",
        fontSize: "14px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    availableField: {
        opacity: 1,
        backgroundColor: "#303030",
        color: "#eee",
    },

    usedField: {
        opacity: 0.55,
        backgroundColor: "#542f2f",
        color: "#ff8a8a",
        cursor: "not-allowed",
    },

    selectedField: {
        backgroundColor: "#444",
    },

    gameArea: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },

    grid: {
        width: "600px",
        height: "500px",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gridTemplateRows: "repeat(6, 1fr)",
        border: "2px solid #555",
        backgroundColor: "#2d2d2d",
    },

    pokemon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #444",
        fontSize: "16px",
        textTransform: "capitalize",
        transition: "opacity 0.2s, background-color 0.2s, color 0.2s",
        backgroundColor: "#303030",
        color: "#eee",
    },

    queryContainer: {
        display: "flex",
        gap: "10px",
    },

    guessContainer: {
        display: "flex",
        gap: "10px",
    },

    input: {
        padding: "10px",
        fontSize: "16px",
        width: "150px",
        backgroundColor: "#303030",
        color: "#eee",
        border: "1px solid #555",
        borderRadius: "4px",
        outline: "none",
    },

    queryButton: {
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#333",
        color: "#eee",
        border: "1px solid #555",
        borderRadius: "4px",
    },
};



