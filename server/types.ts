import type { GameState } from "../src/reversal/types";
import type { GameDifficult, GuessCharacteristic } from "../src/models/types";
import { leaveRoom } from "./room";

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
  message: string;
}

export interface GameStateUpdatedMessage {
  type: "gameStateUpdated";
  game: GameState;
}

export type OpponentLeftMessage = {
  type: "opponentLeft";
};

type BoardSwapStatusMessage = {
    type: "boardSwapStatus";
    requestedBy: string[];
};

export interface PrivateRoomCreatedMessage {
    type: "privateRoomCreated";
    code: string;
}

export interface PrivateRoomJoinFailedMessage {
    type: "privateRoomJoinFailed";
    message: string;
}

// Client messages
export interface SubmitGuessMessage {
  type: "submitGuess";
  elements: number[];
  characteristics: GuessCharacteristic[];
}

type RestartGameMessage = {
  type: "restartGame";
};

type ResetGameForTestMessage = {
  type: "resetGameForTest";
};

type RequestBoardSwapMessage = {
    type: "requestBoardSwap";
};

export type JoinRoomMessage = {
    type: "joinRoom";
    difficulty: GameDifficult;
};

export type LeaveRoomMessage = {
    type: "leaveRoom";
};

export interface CreatePrivateRoomMessage {
    type: "createPrivateRoom";
    difficulty: GameDifficult;
}

export interface JoinPrivateRoomMessage {
    type: "joinPrivateRoom";
    code: string;
}

export type ClientMessage =
  | SubmitGuessMessage
  | RestartGameMessage
  | ResetGameForTestMessage
  | RequestBoardSwapMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | CreatePrivateRoomMessage
  | JoinPrivateRoomMessage;

export type ServerMessage =
  | ConnectedMessage
  | RoomJoinedMessage
  | GameStartedMessage
  | GuessResultMessage
  | GameStateUpdatedMessage
  | OpponentLeftMessage
  | BoardSwapStatusMessage
  | PrivateRoomJoinFailedMessage
  | PrivateRoomCreatedMessage;