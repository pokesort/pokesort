import type { ClientMessage } from "./types";

export function parseClientMessage(
  rawMessage: string
): ClientMessage | null {
  try {
    const data: unknown = JSON.parse(rawMessage);

    if (!data || typeof data !== "object") return null;

    if (!("type" in data)) return null;

    if (data.type === "restartGame") return data as ClientMessage;
    if (data.type === "resetGameForTest") return data as ClientMessage;
    if (data.type === "requestBoardSwap") return data as ClientMessage;
    if (data.type === "joinRoom") return data as ClientMessage;
    if (data.type === "leaveRoom") return data as ClientMessage;
    if (data.type !== "submitGuess") return null;

    if (!("elements" in data) || !Array.isArray(data.elements)) return null;

    if (!("characteristics" in data) || !Array.isArray(data.characteristics)) return null;

    return data as ClientMessage;
  } catch {
    return null;
  }
}