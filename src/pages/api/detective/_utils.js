import { connect, getDb } from "@/lib/mongodb";
import { handlerEvolutionChain, handlerEvolutionStep } from "../../../scripts/handlersPokemon";

let evolutionFormCache = null;
let evolutionStepCache = null;
let pokemonRelationsCache = new Map();

export async function getFieldValuesFromPokemon(pokemon, field) {

    switch (field) {
        case "types":
        case "color":
        case "region":
        case "shape":
        case "egg_groups":
        case "generation":
        case "abilities":
        case "moves":
        case "categories":
            return pokemon[field];
        case "methods":
            return await getEvolutionMethodsFromPokemon(pokemon);
        case "dual":
            return Array.isArray(pokemon.types) ? pokemon.types.length : undefined
        case "others":
            if (!Array.isArray(pokemon.other_forms) || pokemon.other_forms.length === 0) return undefined;
            return pokemon.is_default ? 1 : 2;

        case "weak":
        case "strong": {
            const relations = await getPokemonRelationsCached(pokemon);
            return relations[field];
        }

        case "step": {
            const steps = await getEvolutionStepCache();

            if (steps.no_line.has(pokemon.id)) return "no_line";
            if (steps.has_split.has(pokemon.id)) return "has_split";
            if (steps.is_split.has(pokemon.id)) return "is_split";

            return undefined;
        }

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

export async function getEvolutionStepCache() {
    if (evolutionStepCache) return evolutionStepCache;

    const [noLine, hasSplit, isSplit] = await Promise.all([
        handlerEvolutionStep("no_line", null),
        handlerEvolutionStep("has_split", null),
        handlerEvolutionStep("is_split", null)
    ]);

    evolutionStepCache = {
        no_line: new Set(noLine),
        has_split: new Set(hasSplit),
        is_split: new Set(isSplit)
    };

    return evolutionStepCache;
}