import type { WebSocket } from "ws";

export interface ConnectedPlayer {
  playerId: string;
  socket: WebSocket;
  roomId?: string;
}

let nextPlayerId = 1;

export function createPlayerId(): string {
  const playerId = `player-${nextPlayerId}`;

  nextPlayerId++;

  return playerId;
}