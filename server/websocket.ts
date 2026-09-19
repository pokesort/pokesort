
import { WebSocketServer } from "ws";
import { sendMessage, sendToRoom } from "./messaging";
import { handleMessage } from "./handleMessage";
import { parseClientMessage } from "./validation";

import {
    createPrivateRoom,
    joinPrivateRoom,
    joinRoom,
    leaveRoom,
    startGame,
    type Room,
} from "./room";

import {
    createPlayerId,
    type ConnectedPlayer,
} from "./player";
import { CreatePrivateRoomMessage, JoinPrivateRoomMessage, JoinRoomMessage } from "./types";

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

        if (data.type === "joinRoom" || data.type === "createPrivateRoom" || data.type === "joinPrivateRoom") {

            if (player.roomId || player.joiningRoom) return;

            player.joiningRoom = true;

            try {
                if (data.type === "joinRoom") await handleJoinroom(player, data);

                else if (data.type === "createPrivateRoom") handleCreatePrivateRoom(player, data);

                else await handleJoinPrivateRoom(player, data);

            } finally {
                player.joiningRoom = false;
            }

            return;
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
            difficulty: room.difficulty
        });
    }

    return;
}

function handleCreatePrivateRoom(player: ConnectedPlayer, data: CreatePrivateRoomMessage) {

    const room = createPrivateRoom(
        rooms,
        data.difficulty,
        player
    );

    console.log(`${player.playerId} created private room ${room.code} (${room.difficulty})`);

    if (!room.code) return;

    sendMessage(player.socket, {
        type: "privateRoomCreated",
        code: room.code,
    });

    return;

}

async function handleJoinPrivateRoom(player: ConnectedPlayer, data: JoinPrivateRoomMessage) {

    const room = joinPrivateRoom(
        player,
        rooms,
        data.code
    );

    if (!room) {
        sendMessage(player.socket, {
            type: "privateRoomJoinFailed",
            message: "Sala não encontrada ou cheia.",
        });

        return;
    }

    console.log(`${player.playerId} joined private room ${room.id} (${room.code})`);

    if (room.players.size === 2) {

        await startGame(room);

        sendToRoom(room, {
            type: "gameStarted",
            game: room.game!,
            difficulty: room.difficulty
        });
    }

    return
}
