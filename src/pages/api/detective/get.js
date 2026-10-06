import { connect, getDb } from "@/lib/mongodb";
import { initialGroup, getGroupFromSecret } from "./_secret";
import { populateMovesAbilities } from "../puzzle/_utils";
import { chooseProperties } from "./_utils";

export default async function handler(req, res) {
  try {

    //Experimentar com limites de geração
    await connect();
    const db = getDb();

    const MAX_ATTEMPTS = 100;
    const MAX_GROUPS = 5;
    const MAX_POKEMON_GROUP = 5;

    const { generation, guess_limit, challenge } = req.body;

    let puzzle = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      puzzle = await generatePuzzle(db, MAX_GROUPS, MAX_POKEMON_GROUP, generation, challenge);

      if (puzzle) {
        return res.status(200).json({
          success: true,
          ...puzzle,
          dictionary: await populateMovesAbilities(),
          guess_limit
        });
      }
    }

    if (!puzzle) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível gerar um puzzle válido"
      });
    }

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}

async function generatePuzzle(db, max_groups, amount_pokemon, generation = 9, challenge = null) {

  let firstGroup = await initialGroup(db, amount_pokemon, generation);
  if (!firstGroup) return null;

  const [secretPokemonData, groups, usedFields, usedPokemonIds] = firstGroup;

  for (let i = 0; i < max_groups - 1; i++) {
    const group = await getGroupFromSecret(
      secretPokemonData,
      usedFields,
      usedPokemonIds,
      amount_pokemon,
      generation
    );

    if (!group) return null;

    group.pokemons.forEach(pokemon => { usedPokemonIds.add(pokemon.id); });

    groups.push(group);
  }

  const usedProperties = chooseProperties(challenge);

  const pokemons = groups
    .flatMap(group => group.pokemons)
    .map(pokemon => ({
        ...pokemon,
        available: true
    }));

  return {
    secretId: secretPokemonData.id,
    pokemons,
    usedProperties,
    // usedFields: [...usedFields],
    // usedPokemonIds: [...usedPokemonIds]
  };
}