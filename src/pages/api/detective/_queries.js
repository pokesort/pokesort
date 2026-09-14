
import { FIELD_OPTIONS } from "../../../scripts/utils";
import { pickRandom, randomInRange } from "../../../scripts/utils";
import { filterPokemons } from "../../../scripts/server_utils";
import { getFieldValuesFromPokemon } from "./_utils"; 

export async function getRandomFieldAndValue() {
  const fields = Object.keys(FIELD_OPTIONS);

  if (fields.length === 0) return null;

  const field = pickRandom(fields)[0];
  const options = FIELD_OPTIONS[field];

  let value;

  if (Array.isArray(options)) {

    if (options.length === 0) return null;
    value = pickRandom(options)[0];

  }
  else if (typeof options === "object" && options.min !== undefined && options.max !== undefined) {
    value = randomInRange(options.min, options.max);
  }
  else return null;

  return { field, value };
}

export async function getPokemonsByFieldAndValue(amount_pokemon, field, value, usedPokemonIds = new Set()) {
  const query = { [field]: value };

  const pokemons = await filterPokemons(query);

  const availablePokemons = pokemons.filter(pokemon => !usedPokemonIds.has(pokemon.id));

  if (availablePokemons.length < amount_pokemon) return null;

  return pickRandom(availablePokemons, amount_pokemon);
}

export async function getAvailableValuesFromPokemon(pokemon, field, usedValues = new Set()) {

    const value = await getFieldValuesFromPokemon(pokemon, field);

    if (value === undefined || value === null) return [];

    const values = Array.isArray(value) ? value : [value];

    return values.filter(value => !usedValues.has(value));
}

export async function getRandomFieldFromPokemon(pokemon, usedFields) {

    const availableFields = [];

    for (const field of Object.keys(FIELD_OPTIONS)) {

        if (usedFields.has(field)) continue;

        const value = await getFieldValuesFromPokemon(pokemon, field);

        if (value === undefined || value === null) continue;

        if (Array.isArray(value) && value.length === 0) continue;

        availableFields.push(field);
    }

    if (availableFields.length === 0) return null;

    return pickRandom(availableFields)[0];
}