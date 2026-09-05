import { Pokemon } from "../models/types";

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  board: Pokemon[];
  players: Player[];
  status: "waiting" | "playing" | "finished";
  result: GameResult | null;
}

export type GameResult =
  | {
      type: "winner";
      playerId: string;
    }
  | {
      type: "draw";
    };