import { pickRandom, FIELD_OPTIONS } from "../scripts/utils";
import { connect, getDb } from "@/lib/mongodb";


export async function getFieldValuesFromPokemon(pokemon, field) {

  let relations = {};

  switch (field) {
    // case "types":
    // case "color":
    // case "region":
    // case "shape":
    // case "egg_groups":
    case "generation":
    case "abilities":
    // case "moves":
    // case "categories":
      return pokemon[field];

    case "dual":
      return Array.isArray(pokemon.types) ? pokemon.types.length : undefined

    case "weak":
      if (relations.length == 0) return relations.weak;

      else{
        relations = await getPokemonRelations(pokemon);
        return relations.weak;
      }
    case "strong":
      if (relations.length == 0) return relations.strong;
      else{
        relations = await getPokemonRelations(pokemon);
        return relations.strong;
      }
    default:
      return undefined;
  }
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

export async function getAvailableValuesFromPokemon(pokemon, field, usedValues = new Set()) {

  const value = await getFieldValuesFromPokemon(pokemon, field);

  if (value === undefined || value === null) return [];

  const values = Array.isArray(value) ? value : [value];

  return values.filter(value => !usedValues.has(value));
}

export async function getPokemonRelations(pokemon) {

    const weak = [];
    const strong = [];

    if (!Array.isArray(pokemon.types) || pokemon.types.length === 0) {
        return {
            weak,
            strong
        };
    }

    await connect();
    const db = getDb();

    const types = await db.db.collection("types")
        .find({
            id: { $in: pokemon.types.map(Number) }
        })
        .project({
            _id: 0,
            id: 1,
            matchups: 1
        })
        .toArray();

    // Percorre os 18 tipos que podem atacar o Pokémon
    for (let attackingType = 1; attackingType <= 18; attackingType++) {

        let totalMultiplier = 1;

        // Multiplica o matchup contra cada tipo do Pokémon
        for (const pokemonType of types) {

            const multiplier = pokemonType.matchups?.[attackingType] ?? 1;

            totalMultiplier *= multiplier;
        }

        if (totalMultiplier >= 2)  weak.push(attackingType);

        if (totalMultiplier > 0 && totalMultiplier < 1) strong.push(attackingType);
    }

    return {
        weak,
        strong
    };
}

//CORRIGIR BUG DO RELATION TYPE, CONSOLE.LOG RETORNO
