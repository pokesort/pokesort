import type { GameState } from "../src/reversal/types";
import type { GuessCharacteristic } from "../src/models/types";

// Server messages
export interface RoomJoinedMessage {
  type: "roomJoined";
  roomId: string;
  playerCount: number;
}

export interface ConnectedMessage {
  type: "connected";
  playerId: string;
}

export interface GameStartedMessage {
  type: "gameStarted";
  game: GameState;
}

export interface GuessResultMessage {
  type: "guessResult";
  valid: boolean;
  points: number;
  removedPokemon: number[];
}

export interface GameStateUpdatedMessage {
  type: "gameStateUpdated";
  game: GameState;
}

export type OpponentLeftMessage = {
  type: "opponentLeft";
};

// Client messages
export interface SubmitGuessMessage {
  type: "submitGuess";
  elements: number[];
  characteristics: GuessCharacteristic[];
}

type RestartGameMessage = {
  type: "restartGame";
};

export type ClientMessage =
  | SubmitGuessMessage
  | RestartGameMessage;

export type ServerMessage =
  | ConnectedMessage
  | RoomJoinedMessage
  | GameStartedMessage
  | GuessResultMessage
  | GameStateUpdatedMessage
  | OpponentLeftMessage;