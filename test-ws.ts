import WebSocket from "ws";

const player1 = new WebSocket("ws://localhost:3001");
const player2 = new WebSocket("ws://localhost:3001");

player1.on("open", () => {
    console.log("Player 1 conectado");
});

player1.on("message", (message) => {
    console.log("Player 1 recebeu:", message.toString());
});

player2.on("open", () => {
    console.log("Player 2 conectado");
});

player2.on("message", (message) => {
    console.log("Player 2 recebeu:", message.toString());
});