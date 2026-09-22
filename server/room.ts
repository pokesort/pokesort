import type { Player } from "./player";
import type { GameState } from "../src/reversal/types";
import { createGame } from "../src/reversal/createGame";
import {getPokemonBoard} from "../src/scripts/server_utils";
import { DIFFICULTY_POKEMON_COUNT, GameDifficult, GuessCharacteristic } from "@/src/models/types";

export type RoomType = "public" | "private"

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
  type: RoomType;
  players: Map<string, Player>;
  game?: GameState;
  code?: string;
  pendingGuesses: PendingGuess[];
  nextGuessOrder: number;
  swapRequests: Set<string>;
  difficulty: GameDifficult;
}

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;

let nextRoomId = 1;

export function createRoom(rooms: Map<string, Room>, difficulty: GameDifficult, type: RoomType, code?: string): Room {

  const room: Room = {
    id: `room-${nextRoomId}`,
    type,
    code,
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

export function createPrivateRoom(rooms: Map<string, Room>, difficulty: GameDifficult, player: Player): Room {

    const code = generateRoomCode(rooms);

    const room = createRoom(
        rooms,
        difficulty,
        "private",
        code
    );

    room.players.set(player.playerId, player);
    player.roomId = room.id;

    return room;
}

function generateRoomCode(rooms: Map<string, Room>): string {
    const usedCodes = new Set(Array.from(rooms.values(), (room) => room.code));

    let code = generateCode();

    while (usedCodes.has(code)) code = generateCode();

    return code;
}

function generateCode(): string {
    return Array.from({ length: ROOM_CODE_LENGTH }, () =>
        ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join("");
}

export function findAvailableRoom(rooms: Map<string, Room>, difficulty: GameDifficult): Room | undefined {

  for (const room of rooms.values()) {

    if (room.players.size < 2 && room.difficulty === difficulty && room.type === "public") return room;
  }

  return undefined;
}

export function joinRoom(player: Player, rooms: Map<string, Room>, difficulty: GameDifficult): Room {
  
  let room = findAvailableRoom(rooms, difficulty);

  if (!room)  room = createRoom(rooms, difficulty, "public");

  room.players.set(player.playerId, player);
  player.roomId = room.id;

  return room;
}

export function joinPrivateRoom(player: Player, rooms: Map<string, Room>,code: string): Room | null {

    code = code.trim().toUpperCase();

    //Considerar criar novo map usando codigo pras salas privadas

    const room = Array.from(rooms.values()).find(
        (room) =>
            room.type === "private" &&
            room.code === code &&
            room.players.size < 2
    );

    if (!room) return null;

    room.players.set(player.playerId, player);
    player.roomId = room.id;

    return room;
}

export function leaveRoom(rooms: Map<string, Room>, player: Player): Room | undefined {

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

export async function resetGameForTest(room: Room): Promise<boolean> {
    if (room.players.size !== 2) return false;

    const playerIds = Array.from(room.players.keys());
    const pokemonCount = DIFFICULTY_POKEMON_COUNT[room.difficulty];
    const pokemonBoard = await getPokemonBoard(pokemonCount);

    room.game = createGame(playerIds, pokemonBoard);
    room.pendingGuesses = [];

    return true;
}