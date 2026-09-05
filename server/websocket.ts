
import { WebSocketServer } from "ws";
import { sendMessage, sendToRoom } from "./messaging";
import { handleMessage } from "./handleMessage";
import { parseClientMessage } from "./validation";

import {
    joinRoom,
    leaveRoom,
    startGame,
    type Room,
} from "./room";

import {
    createPlayerId,
    type ConnectedPlayer,
} from "./player";

const PORT = 3001;

const wss = new WebSocketServer({
    port: PORT,
});

const players = new Map<string, ConnectedPlayer>();
const rooms = new Map<string, Room>();

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", async (socket) => {

    const playerId = createPlayerId();

    const player: ConnectedPlayer = {
        playerId,
        socket,
    };

    players.set(playerId, player);

    const room = joinRoom(player, rooms);

    if (room.players.size === 2) {

        await startGame(room);

        console.log("Game created:", room.game);

        sendToRoom(room, {
            type: "gameStarted",
            game: room.game!,
        });
    }

    console.log(`${playerId} joined ${room.id}`);

    sendMessage(socket, {
        type: "connected",
        playerId,
    });

    socket.on("message", async (message) => {
        const data = parseClientMessage(message.toString());

        if (!data) {
            console.error("Invalid client message received");
            return;
        }

        console.log("Message received:", data);

        if (!player.roomId) return;

        const room = rooms.get(player.roomId);

        if (!room) return;

        await handleMessage(player, room, data);
    });

    socket.on("close", () => {

        //Talvez seja necessário buscar a sala antes de sair
        // const room = player.roomId
        //     ? rooms.get(player.roomId)
        //     : undefined;

        leaveRoom(rooms, player);
        console.log(`${playerId} disconnected`);

        if (room && room.players.size === 1) {
            const remainingPlayer = room.players.values().next().value;

            if (remainingPlayer) {
                sendMessage(remainingPlayer.socket, {
                    type: "opponentLeft",
                });
            }
        }
    });
});