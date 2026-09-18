
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
import { JoinRoomMessage } from "./types";

const PORT = 3001;

const wss = new WebSocketServer({
    port: PORT,
});

const players = new Map<string, ConnectedPlayer>();
const rooms = new Map<string, Room>();
//Considerar criar novo map usando codigo pras salas privadas

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", async (socket) => {

    const playerId = createPlayerId();

    const player: ConnectedPlayer = {
        playerId,
        socket,
        joiningRoom: false
    };

    players.set(playerId, player);

    console.log(`${playerId} joined`);

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

        if (data.type === "leaveRoom") {
            
            if (!player.roomId) return;

            leaveRoom(rooms, player);
            return;
        }

        if (data.type === "joinRoom") {

            if (player.roomId || player.joiningRoom) return;

            player.joiningRoom = true;

            try {
                await handleJoinroom(player, data);
            } finally {
                player.joiningRoom = false;
            }
            return
        }

        if (!player.roomId) return;

        const room = rooms.get(player.roomId);

        if (!room) return;

        await handleMessage(player, room, data);
    });

    socket.on("close", () => {

        const room = player.roomId
            ? rooms.get(player.roomId)
            : undefined;

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

async function handleJoinroom(player: ConnectedPlayer, data: JoinRoomMessage) {

    if (player.roomId) return;

    const room = joinRoom(
        player,
        rooms,
        data.difficulty
    );

    console.log(`${player.playerId} joined ${room.id} (${room.difficulty})`);

    if (room.players.size === 2) {

        await startGame(room);

        sendToRoom(room, {
            type: "gameStarted",
            game: room.game!,
        });
    }

    return;
}