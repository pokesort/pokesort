
import { WebSocketServer } from "ws";
import { sendMessage, sendToRoom } from "./messaging";
import { handleMessage } from "./handleMessage";
import { parseClientMessage } from "./validation";
import { CreatePrivateRoomMessage, JoinPrivateRoomMessage, JoinRoomMessage } from "./types";
import crypto from "crypto";

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
    reconnectPlayer,
    type Player,
} from "./player";

const PORT = 3001;

const wss = new WebSocketServer({
    port: PORT,
});

const RECONNECT_TIME = 30_000;

const players = new Map<string, Player>();
const rooms = new Map<string, Room>();
//Considerar criar novo map usando codigo pras salas privadas

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", async (socket) => {

    //Cria o player assim que conecta. Removido pois a tentativa de conexão pode ser uma reconexão
    // const playerId = createPlayerId();

    // let player: Player = {
    //     playerId,
    //     socket,
    //     joiningRoom: false,
    //     connected: true,
    //     reconnectToken: generateReconnectToken()
    // };

    // players.set(playerId, player);
    // console.log(`${playerId} joined`);

    let player: Player | null = null;
    let identified = false;

    socket.on("message", async (message) => {
        const data = parseClientMessage(message.toString());

        if (!data) {
            console.error("Invalid client message received");
            return;
        }

        console.log("Message received:", data);

        if (data.type === "reconnect") {

            const reconnectedPlayer = reconnectPlayer(
                players,
                socket,
                data.playerId,
                data.reconnectToken
            );

            if (!reconnectedPlayer) {
                sendMessage(socket, {
                    type: "reconnectFailed",
                    message: "Não foi possível reconectar."
                });
                return;
            }

            player = reconnectedPlayer;
            identified = true;

            if (!player.roomId) return;

            const room = rooms.get(player.roomId);

            if (!room || !room.game) return;

            sendMessage(socket, {
                type: "reconnected",
                game: room.game,
                difficulty: room.difficulty,
            });

            return;
        }

        if (!identified) {

            const playerId = createPlayerId();

            player = {
                playerId,
                socket,
                joiningRoom: false,
                connected: true,
                reconnectToken: generateReconnectToken()
            }

            players.set(playerId, player);
            identified = true;

            console.log(`${playerId} joined`);

            sendMessage(socket, {
                type: "connected",
                playerId: player.playerId,
                reconnectToken: player.reconnectToken
            });
        }

        if (data.type === "leaveRoom") {

            if (!player) return;
            if (!player.roomId) return;

            leaveRoom(rooms, player);
            return;
        }

        if (data.type === "joinRoom" || data.type === "createPrivateRoom" || data.type === "joinPrivateRoom") {

            if (!player) return;
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

        
        if (!player || !player.roomId) return;

        const room = rooms.get(player.roomId);

        if (!room) return;

        await handleMessage(player, room, data);
    });

    socket.on("close", () => {

        if (!player) return;
        if (player.socket !== socket) return;

        const playerId = player.playerId;

        player.connected = false;
        player.socket = null;

        console.log(`${playerId} disconnected`);

        player.reconnectTimeout = setTimeout(() => {

            if (!player || player.connected) return;

            console.log(`${playerId} reconnection timeout expired`);

            const room = player.roomId
                ? rooms.get(player.roomId)
                : undefined;

            leaveRoom(rooms, player);


            if (room && room.players.size === 1) {
                const remainingPlayer = room.players.values().next().value;

                if (remainingPlayer && remainingPlayer.socket) {
                    sendMessage(remainingPlayer.socket, {
                        type: "opponentLeft",
                    });
                }
            }

        }, RECONNECT_TIME);
    });
});

async function handleJoinroom(player: Player, data: JoinRoomMessage) {

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

function handleCreatePrivateRoom(player: Player, data: CreatePrivateRoomMessage) {

    const room = createPrivateRoom(
        rooms,
        data.difficulty,
        player
    );

    console.log(`${player.playerId} created private room ${room.code} (${room.difficulty})`);

    if (!room.code) return;
    if (!player.socket) return;

    sendMessage(player.socket, {
        type: "privateRoomCreated",
        code: room.code,
    });

    return;

}

async function handleJoinPrivateRoom(player: Player, data: JoinPrivateRoomMessage) {

    const room = joinPrivateRoom(
        player,
        rooms,
        data.code
    );

    if (!room) {

        if (player.socket) {
            sendMessage(player.socket, {
                type: "privateRoomJoinFailed",
                message: "Sala não encontrada ou cheia.",
            });
        }
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

function generateReconnectToken(): string {

    return crypto.randomBytes(32).toString("hex");
}
