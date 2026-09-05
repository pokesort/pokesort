import { CHARACTERISTIC_DEFINITIONS, GuessCharacteristic, Pokemon } from "../models/types";
import { filterPokemons } from "../scripts/server_utils";

export interface GuessResult {
  valid: boolean;
  points: number;
}

export const falseResults: GuessResult = {
  valid: false,
  points: 0,
};

export async function validateGuess(selectedPokemon: Pokemon[], guess: GuessCharacteristic[]): Promise<GuessResult> {

    if (guess.length < 1 || guess.length > 3) return falseResults;

    if (!combinationsIsValid(guess)) return falseResults;

    for (const characteristic of guess) {
        if (!CHARACTERISTIC_DEFINITIONS[characteristic.type]) {
            return falseResults;
        }
    }

    const query = guess.reduce<Record<string, string>>(
        (query, characteristic) => {
            query[characteristic.type] = characteristic.value;
            return query;
        },
        {}
    );

    const filteredPokemon = await filterPokemons(query);

    const filteredIds = new Set(filteredPokemon.map((pokemon:{id: number}) => pokemon.id));

    if (!selectedPokemon.every((pokemon) => filteredIds.has(pokemon.id))) return falseResults;

    const points = guess.reduce(
        (total, characteristic) =>
            total + CHARACTERISTIC_DEFINITIONS[characteristic.type].points,
        0
    );

    return {
        valid: true,
        points,
    };
}

function combinationsIsValid(guess: GuessCharacteristic[]): boolean {
  const combinations = new Set(
    guess.map(
      (characteristic) =>
        `${characteristic.type}:${characteristic.value}`
    )
  );

  return combinations.size === guess.length;
}