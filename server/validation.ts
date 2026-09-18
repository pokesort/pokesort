
import type { ClientMessage } from "./types";
import type { GameDifficult } from "../src/models/types";

const SIMPLE_MESSAGE_TYPES: Set<string> = new Set([
    "restartGame",
    "resetGameForTest",
    "requestBoardSwap",
    "leaveRoom",
]);

const DIFFICULTIES: GameDifficult[] = [
    "easy",
    "medium",
    "hard",
];

function isGameDifficulty(value: unknown): value is GameDifficult {
  
    return typeof value === "string" && DIFFICULTIES.includes(value as GameDifficult);
}

function isJoinRoomMessage(data: Record<string, unknown>): boolean {

    return data.type === "joinRoom" && isGameDifficulty(data.difficulty);
}

function isCreatePrivateRoomMessage(data: Record<string, unknown>): boolean {

    return data.type === "createPrivateRoom" && isGameDifficulty(data.difficulty);
}

function isJoinPrivateRoomMessage(data: Record<string, unknown>): boolean {

    return data.type === "joinPrivateRoom" && typeof data.code === "string" && data.code.trim().length > 0;
}

function isSubmitGuessMessage(data: Record<string, unknown>): boolean {

    return data.type === "submitGuess" && Array.isArray(data.elements) && Array.isArray(data.characteristics);
}

export function parseClientMessage(rawMessage: string): ClientMessage | null {
    try {
        const data: unknown = JSON.parse(rawMessage);

        if (!data || typeof data !== "object") return null;
        if (!("type" in data)) return null;
        if (typeof data.type !== "string") return null;

        const message = data as Record<string, unknown>;

        if (SIMPLE_MESSAGE_TYPES.has(data.type)) return message as ClientMessage;

        if (isJoinRoomMessage(message)) return message as ClientMessage;

        if (isCreatePrivateRoomMessage(message)) return message as ClientMessage;

        if (isJoinPrivateRoomMessage(message)) return message as ClientMessage;

        if (isSubmitGuessMessage(message)) return message as ClientMessage;

        return null;
    } catch {
        return null;
    }
}
