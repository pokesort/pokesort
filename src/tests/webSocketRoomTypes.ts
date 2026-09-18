import WebSocket from "ws";

const WS_URL = "ws://localhost:3001";

let testFailed = false;

function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        testFailed = true;
    }
}

function waitForMessage(
    socket: WebSocket,
    type: string,
    timeout = 5000
): Promise<any> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off("message", handler);
            reject(new Error(`Timeout esperando mensagem: ${type}`));
        }, timeout);

        function handler(raw: WebSocket.RawData) {
            const data = JSON.parse(raw.toString());

            if (data.type !== type) return;

            clearTimeout(timer);
            socket.off("message", handler);
            resolve(data);
        }

        socket.on("message", handler);
    });
}

function connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_URL);

        socket.once("open", () => resolve(socket));
        socket.once("error", reject);
    });
}

async function createPrivateRoom(
    socket: WebSocket,
    difficulty: "easy" | "medium" | "hard"
): Promise<string> {
    socket.send(JSON.stringify({
        type: "createPrivateRoom",
        difficulty,
    }));

    const response = await waitForMessage(
        socket,
        "privateRoomCreated"
    );

    assert(
        typeof response.code === "string" && response.code.length > 0,
        "Sala privada deveria retornar um código."
    );

    return response.code;
}

async function closeSockets(...sockets: WebSocket[]): Promise<void> {
    for (const socket of sockets) {
        if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        ) {
            socket.close();
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
}

async function testCreateAndJoinPrivateRoom(): Promise<void> {
    console.log("\nTESTE 1: criação e entrada em sala privada");

    const player1 = await connect();
    await waitForMessage(player1, "connected");

    const code = await createPrivateRoom(player1, "easy");

    const player2 = await connect();
    await waitForMessage(player2, "connected");

    const gameStarted1 = waitForMessage(player1, "gameStarted");
    const gameStarted2 = waitForMessage(player2, "gameStarted");

    player2.send(JSON.stringify({
        type: "joinPrivateRoom",
        code,
    }));

    await Promise.all([
        gameStarted1,
        gameStarted2,
    ]);

    console.log("PASS: criação e entrada em sala privada funcionando.");

    await closeSockets(player1, player2);
}

async function testInvalidPrivateRoomCode(): Promise<void> {
    console.log("\nTESTE 2: código de sala privada inválido");

    const player = await connect();
    await waitForMessage(player, "connected");

    player.send(JSON.stringify({
        type: "joinPrivateRoom",
        code: "XXXXXX",
    }));

    const response = await waitForMessage(
        player,
        "privateRoomJoinFailed"
    );

    assert(
        response.type === "privateRoomJoinFailed",
        "Deveria retornar privateRoomJoinFailed."
    );

    console.log("PASS: código inválido rejeitado.");

    await closeSockets(player);
}

async function testPrivateRoomFull(): Promise<void> {
    console.log("\nTESTE 3: sala privada cheia");

    const player1 = await connect();
    await waitForMessage(player1, "connected");

    const code = await createPrivateRoom(player1, "easy");

    const player2 = await connect();
    await waitForMessage(player2, "connected");

    const gameStarted1 = waitForMessage(player1, "gameStarted");
    const gameStarted2 = waitForMessage(player2, "gameStarted");

    player2.send(JSON.stringify({
        type: "joinPrivateRoom",
        code,
    }));

    await Promise.all([
        gameStarted1,
        gameStarted2,
    ]);

    const player3 = await connect();
    await waitForMessage(player3, "connected");

    player3.send(JSON.stringify({
        type: "joinPrivateRoom",
        code,
    }));

    const response = await waitForMessage(
        player3,
        "privateRoomJoinFailed"
    );

    assert(
        response.type === "privateRoomJoinFailed",
        "Terceiro jogador deveria ser rejeitado."
    );

    console.log("PASS: sala privada cheia rejeitou terceiro jogador.");

    await closeSockets(player1, player2, player3);
}

async function testPrivateRoomIsNotPublic(): Promise<void> {
    console.log("\nTESTE 4: sala privada não participa do matchmaking público");

    const player1 = await connect();
    await waitForMessage(player1, "connected");

    const code = await createPrivateRoom(player1, "easy");

    assert(
        typeof code === "string" && code.length > 0,
        "Sala privada deveria possuir código."
    );

    const player2 = await connect();
    await waitForMessage(player2, "connected");

    player2.send(JSON.stringify({
        type: "joinRoom",
        difficulty: "easy",
    }));

    let joinedPrivateRoom = false;

    try {
        await waitForMessage(player2, "gameStarted", 1000);
        joinedPrivateRoom = true;
    } catch {
        // Esperado: matchmaking público não deve entrar na sala privada.
    }

    assert(
        !joinedPrivateRoom,
        "Jogador público não deveria entrar na sala privada."
    );

    console.log(
        "PASS: sala privada não participou do matchmaking público."
    );

    await closeSockets(player1, player2);
}

async function main(): Promise<void> {
    try {
        await testCreateAndJoinPrivateRoom();
        await testInvalidPrivateRoomCode();
        await testPrivateRoomFull();
        await testPrivateRoomIsNotPublic();
    } catch (error) {
        console.error("ERRO durante os testes:", error);
        testFailed = true;
    }

    if (testFailed) {
        console.error("\nAlgum teste falhou.");
        process.exitCode = 1;
        return;
    }

    console.log("\nTodos os testes de tipos de sala passaram.");
}

main();