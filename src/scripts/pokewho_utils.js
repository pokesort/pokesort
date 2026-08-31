import { pickRandom, FIELD_OPTIONS } from "../scripts/utils";
import { connect, getDb } from "@/lib/mongodb";
import { handlerEvolutionChain } from "../scripts/handlersPokemon";
import { Console } from "console";

let evolutionFormCache = null;
let pokemonRelationsCache = new Map();

export async function getFieldValuesFromPokemon(pokemon, field) {

    switch (field) {
        // case "types":
        // case "color":
        // case "region":
        // case "shape":
        // case "egg_groups":
        // case "generation":
        // case "abilities":
        // case "moves":
        // case "categories":
        //   return pokemon[field];

        // case "dual":
        //   return Array.isArray(pokemon.types) ? pokemon.types.length : undefined

        case "weak":
        case "strong": {
            const relations = await getPokemonRelationsCached(pokemon);
            return relations[field];
        }
        case "methods":
            return await getEvolutionMethodsFromPokemon(pokemon);
        case "form": {
            const forms = await getEvolutionFormCache();

            if (forms.first.has(pokemon.id)) return "first";
            if (forms.middle.has(pokemon.id)) return "middle";
            if (forms.final.has(pokemon.id)) return "final";

            return undefined;
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
            id: { $in: pokemon.types }
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

        if (totalMultiplier >= 2) weak.push(attackingType);

        if (totalMultiplier > 0 && totalMultiplier < 1) strong.push(attackingType);
    }

    return {
        weak,
        strong
    };
}

export async function getEvolutionMethodsFromPokemon(pokemon) {
    if (pokemon?.id === undefined || pokemon?.id === null) return [];

    await connect();
    const db = getDb();

    const evolutionSteps = await db.db.collection("evolution_steps")
        .find({
            pokemon: Number(pokemon.id)
        })
        .project({
            _id: 0,
            methods: 1
        })
        .toArray();

    return [
        ...new Set(
            evolutionSteps.flatMap(step => step.methods ?? [])
        )
    ];
}

export async function getEvolutionFormCache() {

    if (evolutionFormCache) return evolutionFormCache;

    const [first, middle, final] = await Promise.all([
        handlerEvolutionChain("first"),
        handlerEvolutionChain("middle"),
        handlerEvolutionChain("final")
    ]);

    evolutionFormCache = {
        first: new Set(first),
        middle: new Set(middle),
        final: new Set(final)
    };

    return evolutionFormCache;
}

export async function getPokemonRelationsCached(pokemon) {

    if (pokemonRelationsCache.has(pokemon.id)) return pokemonRelationsCache.get(pokemon.id);

    const relations = await getPokemonRelations(pokemon);

    pokemonRelationsCache.set(pokemon.id, relations);

    return relations;
}