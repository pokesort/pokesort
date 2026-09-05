import { restartGame, type Room } from "./room";
import type { ConnectedPlayer } from "./player";
import type { ClientMessage } from "./types";
import { submitGuess } from "../src/reversal/submitGuess";
import { sendMessage, sendToRoom } from "./messaging";

export async function handleMessage(player: ConnectedPlayer, room: Room, message: ClientMessage): Promise<void> {

  if (message.type === "restartGame") {
    const restarted = await restartGame(room);

    if (!restarted) return;

    sendToRoom(room, {
      type: "gameStarted",
      game: room.game!,
    });

    return;
  }

  if (message.type === "submitGuess") {

    if (!room.game) return;

    const result = await submitGuess(
      room.game,
      player.playerId,
      message.elements,
      message.characteristics
    );

    sendMessage(player.socket, {
      type: "guessResult",
      valid: result.valid,
      points: result.points,
      removedPokemon: result.removedPokemon,
    });

    if (!result.valid) return;

    sendToRoom(room, {
      type: "gameStateUpdated",
      game: room.game,
    });
  }
}