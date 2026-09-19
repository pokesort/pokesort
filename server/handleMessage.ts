import { resetGameForTest, restartGame, type Room } from "./room";
import type { ConnectedPlayer } from "./player";
import type { ClientMessage } from "./types";
import { submitGuess, swapBoard, determineResult } from "../src/reversal/submitGuess";
import { sendMessage, sendToRoom } from "./messaging";

export async function handleMessage(player: ConnectedPlayer, room: Room, message: ClientMessage): Promise<void> {

  if (message.type === "restartGame") {
    const restarted = await restartGame(room);

    if (!restarted) return;

    sendToRoom(room, {
      type: "gameStarted",
      game: room.game!,
      difficulty: room.difficulty
    });

    return;
  }

  if (message.type === "submitGuess") {

    if (!room.game) return;

    const result = await submitGuess(
      room,
      player.playerId,
      message.elements,
      message.characteristics
    );

    sendMessage(player.socket, {
      type: "guessResult",
      valid: result.valid,
      points: result.points,
      removedPokemon: result.removedPokemon,
      message: result.message,
    });

    if (!result.valid) return;

    room.swapRequests.clear();

    if (room.game.status === "playing") {

      sendToRoom(room, {
        type: "boardSwapStatus",
        requestedBy: [],
      });
    }

    sendToRoom(room, {
      type: "gameStateUpdated",
      game: room.game,
    });
  }

  if (message.type === "resetGameForTest") {
    const reset = await resetGameForTest(room);
    if (!reset) return;

    sendToRoom(room, {
      type: "gameStarted",
      game: room.game!,
      difficulty: room.difficulty
    });

    return;
  }

  if (message.type === "requestBoardSwap") {

    if (!room.game || room.game.status !== "playing") return;
    if (room.swapRequests.has(player.playerId)) return;

    room.swapRequests.add(player.playerId);

    if (room.swapRequests.size < 2) {
      sendToRoom(room, {
        type: "boardSwapStatus",
        requestedBy: Array.from(room.swapRequests),
      });
      return;
    }

    swapBoard(room.game);
    room.swapRequests.clear();

    determineResult(room.game);

    sendToRoom(room, {
      type: "boardSwapStatus",
      requestedBy: [],
    });

    sendToRoom(room, {
      type: "gameStateUpdated",
      game: room.game,
    });
  }
}