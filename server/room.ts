import type { ConnectedPlayer } from "./player";
import type { GameState } from "../src/reversal/types";
import { createGame } from "../src/reversal/createGame";
import {getPokemonBoard} from "../src/scripts/server_utils";
import { GuessCharacteristic } from "@/src/models/types";

export interface PendingGuess {
    playerId: string;
    pokemonIds: number[];
    characteristics: GuessCharacteristic[];
    points: number;
    timestamp: number;
    order: number;
}

export interface Room {
  id: string;
  players: Map<string, ConnectedPlayer>;
  game?: GameState;
  pendingGuesses: PendingGuess[];
  nextGuessOrder: number;
}

let nextRoomId = 1;

export function createRoom(rooms: Map<string, Room>): Room {
  const room: Room = {
    id: `room-${nextRoomId}`,
    players: new Map(),
    pendingGuesses: [],
    nextGuessOrder: 0,
  };

  nextRoomId++;

  rooms.set(room.id, room);

  return room;
}

export function findAvailableRoom(rooms: Map<string, Room>): Room | undefined {

  for (const room of rooms.values()) {
    if (room.players.size < 2) {
      return room;
    }
  }

  return undefined;
}

export function joinRoom(player: ConnectedPlayer, rooms: Map<string, Room>): Room {
  let room = findAvailableRoom(rooms);

  if (!room) {
    room = createRoom(rooms);
  }

  room.players.set(player.playerId, player);
  player.roomId = room.id;

  return room;
}

export function leaveRoom(rooms: Map<string, Room>, player: ConnectedPlayer): Room | undefined {

  if (!player.roomId) return undefined;

  const room = rooms.get(player.roomId);

  if (!room){
    player.roomId = undefined;
    return undefined;
  }

  room.players.delete(player.playerId);

  if (room.players.size === 0) rooms.delete(room.id);
  else room.game = undefined;

  player.roomId = undefined;
  return room;
}

export async function startGame(room: Room): Promise<void> {
  // if (room.players.size !== 2) {
  //   return;
  // }

  const playerIds = Array.from(room.players.keys());
  const pokemonBoard = await getPokemonBoard(20);

  room.game = createGame(playerIds, pokemonBoard);
  room.pendingGuesses = [];
}

export async function restartGame(room: Room): Promise<boolean> {
  if (room.players.size !== 2) return false;

  if (!room.game || room.game.status !== "finished") return false;

  const playerIds = Array.from(room.players.keys());
  const pokemonBoard = await getPokemonBoard(40);

  //Garantir que n tem como falhar
  room.game = createGame(playerIds, pokemonBoard);
  room.pendingGuesses = [];
  return true;
}

export async function resetGameForTest(room: Room): Promise<boolean> {
    if (room.players.size !== 2) return false;

    const playerIds = Array.from(room.players.keys());
    const pokemonBoard = await getPokemonBoard(40);

    room.game = createGame(playerIds, pokemonBoard);
    room.pendingGuesses = [];

    return true;
}