import { pickRandom } from "../../../scripts/utils";
import * as QG from "./_queries";

export async function selectSecretPokemon(pokemons, amount_pokemon) {
  if (!pokemons || pokemons.length !== amount_pokemon) return null;

  return pickRandom(pokemons)[0];
}

// Fazer função para eliminar codigo duplicado na rota pokemon/id
export async function getPokemonById(db, id) {
  return await db.db.collection("pokemon").findOne({id: Number(id)});
}

export async function getGroupFromSecret(secretPokemon, usedFields, usedPokemonIds, amount_pokemon) {
  while (true) {
    const field = await QG.getRandomFieldFromPokemon(secretPokemon, usedFields);

    // Não existem mais campos disponíveis
    if (!field) return null;

    const values = await QG.getAvailableValuesFromPokemon(secretPokemon, field);

    const shuffledValues = pickRandom(values, values.length);

    let foundGroup = null;
    let selectedValue = null;

    for (const value of shuffledValues) {
      const group = await QG.getPokemonsByFieldAndValue(amount_pokemon, field, value, usedPokemonIds);

      if (group) {
        foundGroup = group;
        selectedValue = value;
        break;
      }
    }

    // Encontrou 6 Pokémon para algum valor desse campo
    if (foundGroup) {
      usedFields.add(field);

      return {
        field,
        value: selectedValue,
        pokemons: foundGroup
      };
    }

    // Nenhum valor desse campo conseguiu formar um grupo.
    // O campo é descartado e o while tenta outro.
    usedFields.add(field);
  }
}

export async function initialGroup(db, amount_pokemon){

    let fieldSelected = await QG.getRandomFieldAndValue();

    if (!fieldSelected) return null;

    const pokemons = await QG.getPokemonsByFieldAndValue(
        amount_pokemon,
        fieldSelected.field,
        fieldSelected.value
    );

    if (!pokemons) return null;

    const usedFields = new Set([fieldSelected.field]);
    const usedPokemonIds = new Set(pokemons.map(pokemon => pokemon.id));

    const secretPokemon = await selectSecretPokemon(pokemons, amount_pokemon);

    if (!secretPokemon) return null;

    const secretPokemonData = await getPokemonById(db, secretPokemon.id);

    const groups = [
        {
        field: fieldSelected.field,
        value: fieldSelected.value,
        pokemons
        }
    ];

    return [secretPokemonData, groups, usedFields, usedPokemonIds];
}