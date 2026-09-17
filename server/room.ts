import type { ConnectedPlayer } from "./player";
import type { GameState } from "../src/reversal/types";
import { createGame } from "../src/reversal/createGame";
import {getPokemonBoard} from "../src/scripts/server_utils";
import { DIFFICULTY_POKEMON_COUNT, GameDifficult, GuessCharacteristic } from "@/src/models/types";

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
  swapRequests: Set<string>;
  difficulty: GameDifficult;
}

let nextRoomId = 1;

export function createRoom(rooms: Map<string, Room>, difficulty: GameDifficult): Room {
  const room: Room = {
    id: `room-${nextRoomId}`,
    players: new Map(),
    pendingGuesses: [],
    nextGuessOrder: 0,
    swapRequests: new Set(),
    difficulty
  };

  nextRoomId++;

  rooms.set(room.id, room);

  return room;
}

export function findAvailableRoom(rooms: Map<string, Room>, difficulty: GameDifficult): Room | undefined {

  for (const room of rooms.values()) {

    if (room.players.size < 2 && room.difficulty === difficulty) return room;
  }

  return undefined;
}

export function joinRoom(player: ConnectedPlayer, rooms: Map<string, Room>, difficulty: GameDifficult): Room {
  
  let room = findAvailableRoom(rooms, difficulty);

  if (!room)  room = createRoom(rooms, difficulty);

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
  
  const pokemonCount = DIFFICULTY_POKEMON_COUNT[room.difficulty];
  const pokemonBoard = await getPokemonBoard(pokemonCount);

  room.game = createGame(playerIds, pokemonBoard);
  room.pendingGuesses = [];
}

export async function restartGame(room: Room): Promise<boolean> {
  if (room.players.size !== 2) return false;

  if (!room.game || room.game.status !== "finished") return false;

  await startGame(room);

  return true;
}

//TODO: Adaptar ao teste
export async function resetGameForTest(room: Room): Promise<boolean> {
    if (room.players.size !== 2) return false;

    const playerIds = Array.from(room.players.keys());
    // Se precisar subsituir
    // const pokemonCount = DIFFICULTY_POKEMON_COUNT[room.difficulty];
    // const pokemonBoard = await getPokemonBoard(pokemonCount);
    const pokemonBoard = await getPokemonBoard(40);

    room.game = createGame(playerIds, pokemonBoard);
    room.pendingGuesses = [];

    return true;
}