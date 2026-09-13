import { GuessCharacteristic } from "../models/types";
import { validateGuess } from "./validateGuess";
import { GameState } from "./types";
import type { Room, PendingGuess } from "../../server/room";

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

const CONCURRENCY_WINDOW_MS = 500;

export async function submitGuess(room: Room, playerId: string, pokemonIds: number[], characteristics: GuessCharacteristic[])
  : Promise<SubmitGuessResult> {

  const game = room.game;
  if (!game || game.status !== "playing") return invalidSubmitGuessResult;

  if (pokemonIds.length !== 4) return invalidSubmitGuessResult;

  const selectedPokemons = game.board.filter(
    (pokemon) => pokemonIds.includes(pokemon.id)
  );

  if (selectedPokemons.length !== 4) return invalidSubmitGuessResult;

  const orderGuess = room.nextGuessOrder++;

  const pendingGuess: PendingGuess = {
    playerId,
    pokemonIds,
    characteristics,
    points: 0,
    timestamp: Date.now(),
    order: orderGuess,
  };

  room.pendingGuesses.push(pendingGuess);

  // console.log(
  //   `[VALIDAÇÃO INÍCIO] player=${playerId} ` +
  //   `pokemon=${pokemonIds.join(",")} ` +
  //   `characteristics=${JSON.stringify(characteristics)}`
  // );

  const result = await validateGuess(selectedPokemons, characteristics);

  if (!result.valid) {
    removePendingGuess(room, pendingGuess);
    return invalidSubmitGuessResult;
  }

  pendingGuess.points = result.points;

  // console.log(
  //   `[VALIDAÇÃO FIM] player=${playerId} ` +
  //   `valid=${result.valid} points=${result.points}`
  // );
  const player = game.players.find((player) => player.id === playerId);

  if (!player) return invalidSubmitGuessResult;

  await waitForConcurrentGuesses();

  if (!room.pendingGuesses.includes(pendingGuess)) return invalidSubmitGuessResult;

  const opponentGuess = room.pendingGuesses.find((guess) => guess.playerId !== pendingGuess.playerId);

  if (opponentGuess) {

    // console.log(
    //   `[ARBITRAGEM] player=${pendingGuess.playerId} ` +
    //   `points=${pendingGuess.points} ` +
    //   `opponent=${opponentGuess?.playerId} ` +
    //   `opponentPoints=${opponentGuess?.points}`
    // );
    const hasOverlap = hasPokemonOverlap(pendingGuess.pokemonIds, opponentGuess.pokemonIds);

    if (hasOverlap) {
      const guessToRemove = tiebreaker(pendingGuess, opponentGuess);

      removePendingGuess(room, guessToRemove);

      if (guessToRemove === pendingGuess) return invalidSubmitGuessResult;
    }
  }

  player.score += result.points;

  game.board = game.board.filter((pokemon) => !pokemonIds.includes(pokemon.id));

  refillBoard(game);

  determineResult(game);

  removePendingGuess(room, pendingGuess);

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

async function waitForConcurrentGuesses(): Promise<void> {
  await new Promise((resolve) =>
    setTimeout(resolve, CONCURRENCY_WINDOW_MS)
  );
}

function hasPokemonOverlap(firstPokemonIds: number[], secondPokemonIds: number[]): boolean {
  return firstPokemonIds.some((id) => secondPokemonIds.includes(id));
}

function removePendingGuess(room: Room, pendingGuess: PendingGuess): void {
  room.pendingGuesses = room.pendingGuesses.filter((guess) => guess !== pendingGuess);
}

function tiebreaker(pendingGuess: PendingGuess, opponentGuess: PendingGuess): PendingGuess {

  // console.log(
  //   `[TIEBREAKER] player=${pendingGuess.playerId} ` +
  //   `points=${pendingGuess.points} ` +
  //   `opponent=${opponentGuess.playerId} ` +
  //   `opponentPoints=${opponentGuess.points}`
  // );

  if (pendingGuess.points > opponentGuess.points) return opponentGuess;

  if (pendingGuess.points < opponentGuess.points) return pendingGuess;

  // Se os pontos forem iguais, desempate pela ordem de chegada, retorna o perdedor (quem chegou por ultimo)
  return pendingGuess.order > opponentGuess.order ? pendingGuess : opponentGuess;
}