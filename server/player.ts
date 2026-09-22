import type { WebSocket } from "ws";

export interface Player {
  playerId: string;
  socket: WebSocket | null;
  roomId?: string;
  joiningRoom: boolean;
  connected: boolean;
  reconnectTimeout?: NodeJS.Timeout;
  reconnectToken: string;
}

let nextPlayerId = 1;

export function createPlayerId(): string {
  const playerId = `player-${nextPlayerId}`;

  nextPlayerId++;

  return playerId;
}

export function reconnectPlayer(players: Map<string, Player>, socket: WebSocket, playerId: string, reconnectToken: string): Player | null {

    const player = players.get(playerId);

    if (!player) return null;
    if (player.connected) return null;
    if (player.reconnectToken !== reconnectToken) return null;
    
    if (player.reconnectTimeout) {
        clearTimeout(player.reconnectTimeout);
        player.reconnectTimeout = undefined;
    }

    player.socket = socket;
    player.connected = true;

    return player;
}