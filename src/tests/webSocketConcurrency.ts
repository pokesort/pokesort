import WebSocket from "ws";

const WS_URL = process.env.WS_URL ?? "ws://localhost:3001";

interface Pokemon {
    id: number;
    name: string;
    types?: string[];
    color?: string;
    region?: string;
    generation?: number;
    shape?: string;
}

interface GameState {
    board: Pokemon[];
    reserve: Pokemon[];
}

interface GuessResultMessage {
    type: "guessResult";
    valid: boolean;
    points: number;
    removedPokemon: number[];
}

interface GuessCharacteristic {
    type: string;
    value: string;
}

type TestClient = {
    socket: WebSocket;
    game: GameState | null;
};

const CHARACTERISTIC_POINTS: Record<string, number> = {
    types: 1,
    region: 1,
    generation: 1,
    color: 2,
    habitat: 3,
    shape: 4,
};

let testFailed = false;

async function main(): Promise<void> {
    console.log(`Conectando ao servidor ${WS_URL}...`);

    const MAX_ATTEMPTS = 20;

    const player1 = await connectClient();
    const player2 = await connectClient();

    await joinRoom(player1.socket, "easy");
    await joinRoom(player2.socket, "easy");

    let game = await waitForGame(player1, player2);
    assert(game.board.length === 16, "A dificuldade easy deveria iniciar com 16 Pokémon");
    assert(game.reserve.length === 8, "Easy deveria ter 8 Pokémon na reserva");

    console.log("Game iniciado.");

    let scenario = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`Procurando cenário na partida ${attempt}...`);

        const fullBoard = await getFullPokemons(game.board);
        scenario = findScenario(fullBoard);

        if (scenario) {
            console.log(`Cenário encontrado na partida ${attempt}.`);
            break;
        }

        if (attempt < MAX_ATTEMPTS) {
            console.log("Cenário não encontrado. Reiniciando partida...");

            const nextGame = await restartGame(player1.socket);

            if (!nextGame) {
                console.log("Não foi possível reiniciar a partida. Tentando novamente...");
                continue;
            }

            game = nextGame;
        }
    }

    if (!scenario) {
        throw new Error(
            `Não foi possível encontrar um cenário após ${MAX_ATTEMPTS} partidas.`
        );
    }

    const result1Promise = waitForGuessResult(player1.socket);
    const result2Promise = waitForGuessResult(player2.socket);

    console.log("\nEnviando palpites simultaneamente...");

    sendGuess(
        player1.socket,
        scenario.pokemonIds,
        {
            type: scenario.highPoints.type,
            value: scenario.highPoints.value,
        }
    );

    sendGuess(
        player2.socket,
        scenario.pokemonIds,
        {
            type: scenario.lowPoints.type,
            value: scenario.lowPoints.value,
        }
    );

    const [result1, result2] = await Promise.all([
        result1Promise,
        result2Promise,
    ]);

    assert(result1.valid === true, "P1 deveria ser válido");
    assert(result1.points === scenario.highPoints.points, "P1 deveria receber a pontuação maior");
    assert(result2.valid === false, "P2 deveria ser inválido");
    assert(result2.points === 0, "P2 deveria receber 0 pontos");
    assert(result2.removedPokemon.length === 0, "P2 não deveria remover Pokémon");
    assert(result1.removedPokemon.length === 4, "P1 deveria remover exatamente 4 Pokémon");

    player1.socket.close();
    player2.socket.close();
}

function connectClient(): Promise<TestClient> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_URL);

        const client: TestClient = {
            socket,
            game: null,
        };

        socket.once("open", () => {
            resolve(client);
        });

        socket.once("error", reject);
    });
}

async function joinRoom(socket: WebSocket, difficulty: "easy" | "medium" | "hard"): Promise<void> {
    socket.send(JSON.stringify({
        type: "joinRoom",
        difficulty,
    }));
}

async function waitForGame(player1: TestClient, player2: TestClient): Promise<GameState> {
    const [game1, game2] = await Promise.all([
        waitForGameStarted(player1.socket),
        waitForGameStarted(player2.socket),
    ]);

    assert(
        JSON.stringify(game1.board) === JSON.stringify(game2.board),
        "Os dois jogadores deveriam receber o mesmo board"
    );

    return game1;
}

function waitForGameStarted(socket: WebSocket): Promise<GameState> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout esperando gameStarted"));
        }, 5000);

        const onMessage = (data: WebSocket.RawData) => {
            const message = JSON.parse(data.toString());

            if (message.type !== "gameStarted") return;

            clearTimeout(timeout);
            socket.off("message", onMessage);

            resolve(message.game);
        };

        socket.on("message", onMessage);
    });
}

function waitForGuessResult(socket: WebSocket): Promise<GuessResultMessage> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout esperando guessResult"));
        }, 5000);

        const onMessage = (data: WebSocket.RawData) => {
            const message = JSON.parse(data.toString());

            if (message.type !== "guessResult") return;

            clearTimeout(timeout);
            socket.off("message", onMessage);

            resolve(message);
        };

        socket.on("message", onMessage);
    });
}

async function restartGame(socket: WebSocket): Promise<GameState | null> {
    const nextGame = waitForGameStarted(socket);

    socket.send(JSON.stringify({
        type: "resetGameForTest",
    }));

    try {
        return await nextGame;
    } catch (error) {
        console.error(`Falha ao reiniciar partida: ${(error as Error).message}`);
        return null;
    }
}

function sendGuess(socket: WebSocket, pokemonIds: number[], characteristic: GuessCharacteristic): void {
    socket.send(
        JSON.stringify({
            type: "submitGuess",
            elements: pokemonIds,
            characteristics: [characteristic],
        })
    );
}

function findScenario(board: Pokemon[]) {

    let combinationsWithCharacteristics = 0;
    for (let i = 0; i < board.length; i++) {
        for (let j = i + 1; j < board.length; j++) {
            for (let k = j + 1; k < board.length; k++) {
                for (let l = k + 1; l < board.length; l++) {
                    const pokemon = [
                        board[i],
                        board[j],
                        board[k],
                        board[l],
                    ];

                    const characteristics = findSharedCharacteristics(pokemon);
                    if (characteristics.length > 0) combinationsWithCharacteristics++;

                    if (characteristics.length < 2) continue;

                    for (let a = 0; a < characteristics.length; a++) {
                        for (let b = a + 1; b < characteristics.length; b++) {

                            const first = characteristics[a];
                            const second = characteristics[b];

                            if (first.points === second.points) continue;

                            const highPoints = first.points > second.points ? first : second;

                            const lowPoints = first.points < second.points ? first : second;

                            return { pokemonIds: pokemon.map((p) => p.id), highPoints, lowPoints, };
                        }
                    }
                }
            }
        }
    }
    console.log(`Combinações com pelo menos uma característica: ${combinationsWithCharacteristics}`);
    return null;
}

function findSharedCharacteristics(pokemon: Pokemon[]) {
    const result: {
        type: string;
        value: string;
        points: number;
    }[] = [];

    for (const [type, points] of Object.entries(CHARACTERISTIC_POINTS)) {
        const values = pokemon.map((p) => {
            const value = p[type as keyof Pokemon];

            if (Array.isArray(value)) return value.map(String);

            if (typeof value === "string" || typeof value === "number") return [String(value)];

            return [];
        });

        const sharedValues = values[0].filter((value) => values.every((pokemonValues) => pokemonValues.includes(value))
        );

        for (const value of sharedValues) result.push({ type, value, points });
    }

    return result;
}

async function getFullPokemons(board: Pokemon[]): Promise<Pokemon[]> {
    const response = await fetch("http://localhost:3000/api/pokemon/ids", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ids: board.map((pokemon) => pokemon.id),
        }),
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar Pokémon: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error ?? "Erro ao buscar Pokémon");
    }

    return data.pokemons;
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        testFailed = true;
        return;
    }

    console.log(`PASS: ${message}`);
}

main().then(() => {
    if (testFailed) {
        console.error("\nFAIL: Um ou mais testes falharam.");
        process.exitCode = 1;
        return;
    }

    console.log("\nPASS: cenário de concorrência funcionando.");
})
    .catch((error) => {
        console.error(`FAIL: ${error.message}`);
        process.exitCode = 1;
    });