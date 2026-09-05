import { GameState } from "./types";

export function createGame(playerIds: string[], board: GameState["board"]): GameState {
  return {
    board,
    players: [
      {
        id: playerIds[0],
        name: "Jogador 1",
        score: 0,
      },
      {
        id: playerIds[1],
        name: "Jogador 2",
        score: 0,
      },
    ],

    status: "playing",
    result: null,
  };
}