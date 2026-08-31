import { connect, getDb } from "@/lib/mongodb";
import { initialGroup, getGroupFromSecret } from "./_secret";

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
        return res.status(200).json({
          success: true,
          ...puzzle
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

async function generatePuzzle(db, max_groups, amount_pokemon) {

  let firstGroup = await initialGroup(db, amount_pokemon);
  if (!firstGroup) return null;

  const [secretPokemonData, groups, usedFields, usedPokemonIds] = firstGroup;

  for (let i = 0; i < max_groups - 1; i++) {
    const group = await getGroupFromSecret(
      secretPokemonData,
      usedFields,
      usedPokemonIds,
      amount_pokemon
    );

    if (!group) return null;

    group.pokemons.forEach(pokemon => { usedPokemonIds.add(pokemon.id); });

    groups.push(group);
  }

  return {
    secretPokemonData,
    groups,
    usedFields: [...usedFields],
    usedPokemonIds: [...usedPokemonIds]
  };
}