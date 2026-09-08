import { GuessCharacteristic } from "../models/types";
import { validateGuess } from "./validateGuess";
import { GameState } from "./types";

export interface SubmitGuessResult {
    valid: boolean;
    points: number;
    removedPokemon: number[];
}

export const invalidSubmitGuessResult: SubmitGuessResult = {
  valid: false,
  points: 0,
  removedPokemon: [],
};

export async function submitGuess(game: GameState, playerId: string, pokemonIds: number[], characteristics: GuessCharacteristic[])
  : Promise<SubmitGuessResult> {

  if (game.status !== "playing") return invalidSubmitGuessResult;

  if (pokemonIds.length !== 4) return invalidSubmitGuessResult;

  const selectedPokemons = game.board.filter((pokemon) =>pokemonIds.includes(pokemon.id));

  if (selectedPokemons.length !== 4)  return invalidSubmitGuessResult;

  const result = await validateGuess(selectedPokemons, characteristics);
  console.log("submitGuess result: ", result);
  if (!result.valid) return invalidSubmitGuessResult;

  const player = game.players.find((player) => player.id === playerId);

  if (!player) return invalidSubmitGuessResult;
  
  player.score += result.points;

  game.board = game.board.filter((pokemon) => !pokemonIds.includes(pokemon.id));

  refillBoard(game);

  determineResult(game);

  return {
    valid: true,
    points: result.points,
    removedPokemon: pokemonIds,
  };
}

function determineResult(game: GameState): void {

  if (game.board.length === 0) {
  
  game.status = "finished";

  const [firstPlayer, secondPlayer] = game.players;

  const winner = firstPlayer.score > secondPlayer.score ? firstPlayer : secondPlayer;
  const isDraw = firstPlayer.score === secondPlayer.score;

  game.result = isDraw
    ? { type: "draw" }
    : { type: "winner", playerId: winner.id };
  }
}

function refillBoard(game: GameState): void {
    const amountNeeded = 16 - game.board.length;

    const newPokemon = game.reserve.splice(0, amountNeeded);

    game.board.push(...newPokemon);
}