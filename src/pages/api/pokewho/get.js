import { connect, getDb } from "@/lib/mongodb";
import { pickRandom, randomInRange, FIELD_OPTIONS } from "../../../scripts/utils";
import { filterPokemons } from "../../../scripts/server_utils";
import * as pwUtils from "../../../scripts/pokewho_utils";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const MAX_ATTEMPTS = 100;
    const MAX_GROUPS = 5;
    const MAX_POKEMON_GROUP = 6;

    let puzzle = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      puzzle = await generatePuzzle(db, MAX_GROUPS, MAX_POKEMON_GROUP);

      if (puzzle) {
        res.status(200).json({
          success: true,
          ...puzzle
        });
      }
    }

    if (!puzzle) {
      res.status(500).json({
        success: false,
        error: "Não foi possível gerar um puzzle válido"
      });

      return;
    }

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}

async function getRandomFieldAndValue() {
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

async function getPokemonsByFieldAndValue(amount_pokemon, field, value, usedPokemonIds = new Set()) {
  const query = { [field]: value };

  const pokemons = await filterPokemons(query);

  const availablePokemons = pokemons.filter(pokemon => !usedPokemonIds.has(pokemon.id));

  if (availablePokemons.length < amount_pokemon) return null;

  return pickRandom(availablePokemons, amount_pokemon);
}

async function selectSecretPokemon(pokemons) {
  if (!pokemons || pokemons.length !== 6) {
    return null;
  }

  return pickRandom(pokemons)[0];
}

// Fazer função para eliminar codigo duplicado na rota pokemon/id
async function getPokemonById(db, id) {
  return await db.db.collection("pokemon").findOne({
    id: Number(id)
  });
}

async function getGroupFromSecret(secretPokemon, usedFields, usedPokemonIds, amount_pokemon) {
  while (true) {
    const field = await pwUtils.getRandomFieldFromPokemon(secretPokemon, usedFields);

    // Não existem mais campos disponíveis
    if (!field) return null;

    const values = await pwUtils.getAvailableValuesFromPokemon(secretPokemon, field);

    const shuffledValues = pickRandom(values, values.length);

    let foundGroup = null;
    let selectedValue = null;

    for (const value of shuffledValues) {
      const group = await getPokemonsByFieldAndValue(amount_pokemon, field, value, usedPokemonIds);

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

async function generatePuzzle(db, max_groups, amount_pokemon) {

  let fieldSelected = await getRandomFieldAndValue();

  if (!fieldSelected) return null;

  const pokemons = await getPokemonsByFieldAndValue(
    amount_pokemon,
    fieldSelected.field,
    fieldSelected.value
  );

  if (!pokemons) return null;

  const usedFields = new Set([fieldSelected.field]);
  const usedPokemonIds = new Set(pokemons.map(pokemon => pokemon.id));

  const secretPokemon = await selectSecretPokemon(pokemons);

  if (!secretPokemon) return null;

  const secretPokemonData = await getPokemonById(db, secretPokemon.id);

  const groups = [
    {
      field: fieldSelected.field,
      value: fieldSelected.value,
      pokemons
    }
  ];

  for (let i = 0; i < max_groups - 1; i++) {
    const group = await getGroupFromSecret(
      secretPokemonData,
      usedFields,
      usedPokemonIds,
      amount_pokemon
    );

    if (!group) return null;

    group.pokemons.forEach(pokemon => {usedPokemonIds.add(pokemon.id);});

    groups.push(group);
  }

  return {
    secretPokemonData,
    groups,
    usedFields: [...usedFields],
    usedPokemonIds: [...usedPokemonIds]
  };
}