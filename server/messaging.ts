import { WebSocket } from "ws";
import type { Room } from "./room";
import type { ServerMessage } from "./types";

export function sendMessage(socket: WebSocket, message: ServerMessage): void {

  socket.send(JSON.stringify(message));
}

export function sendToRoom(room: Room, message: ServerMessage): void {

  for (const player of room.players.values()) {
    
    if (!player.connected || !player.socket) continue;
    sendMessage(player.socket, message);
  }
}