import { connect, getDb } from "@/lib/mongodb";
import * as handlers from "../scripts/handlersPokemon";

export async function filterPokemons(query) {

  await connect();
  const db = getDb();

  let filter = {}
  let pokemonIdsUsed = false;
  const arrayFields = ["types", "abilities", "moves", "egg_groups", "categories", "other_forms"];
  const booleanFields = ["is_default"];
  const intFields = ['generation'];

  const step = query.step;

  const methods = query.methods;
  const others = query.others;
  const weak = query.weak;
  const strong = query.strong;
  const immune = query.immune;
  const form = query.form;
  const dual = query.dual;
  const max_generation = query.max_generation;
  const search = query.search;

  const relations_query = {
    "weak": { $gte: 2 },
    "strong": { $gt: 0, $lt: 1 },
    "immune": { $eq: 0 },
  }
  let pokemonIds = [];

  // console.log(JSON.stringify(filter, null, 2)); //printar filtro

  if (step !== undefined) {
    const steps = Array.isArray(step) ? step : [step];

    const results = await Promise.all(steps.map(step => handlers.handlerEvolutionStep(step, filter)));
    pokemonIds = results.flat();
    pokemonIdsUsed = true;
    delete query.step;
  }

  if (methods !== undefined) {
    const methodsIds = await handlers.handlerEvolutionMethod(parseInt(methods));
    pokemonIds = pokemonIds.length > 0 || pokemonIdsUsed ? methodsIds.filter(value => pokemonIds.includes(value)) : methodsIds;
    pokemonIdsUsed = true;
    delete query.methods;
  }

  if (others != undefined) {
    await handlers.handlerOtherForms(parseInt(others), filter);
    delete query.others;
  }

  if (weak != undefined) {
    const weakIds = await handlers.handlerRelationTo(weak, relations_query["weak"]);
    pokemonIds = pokemonIds.length > 0 || pokemonIdsUsed ? weakIds.filter(value => pokemonIds.includes(value)) : weakIds;
    pokemonIdsUsed = true;
    delete query.weak;
  }

  if (strong != undefined) {

    const strongIds = await handlers.handlerRelationTo(strong, relations_query["strong"]);
    pokemonIds = pokemonIds.length > 0 || pokemonIdsUsed ? strongIds.filter(value => pokemonIds.includes(value)) : strongIds;
    pokemonIdsUsed = true;
    delete query.strong;
  }

  if (immune != undefined) {

    const immuneIds = await handlers.handlerRelationTo(immune, relations_query["immune"]);
    pokemonIds = pokemonIds.length > 0 || pokemonIdsUsed ? immuneIds.filter(value => pokemonIds.includes(value)) : immuneIds;
    pokemonIdsUsed = true;
    delete query.immune;

  }
  if (form != undefined) {

    const evoIds = await handlers.handlerEvolutionChain(form);
    pokemonIds = pokemonIds.length > 0 || pokemonIdsUsed ? evoIds.filter(value => pokemonIds.includes(value)) : evoIds;
    pokemonIdsUsed = true;
    delete query.form;
  }

  if (dual != undefined) delete query.dual;
  if (max_generation != undefined) delete query.max_generation;
  if (search != undefined) delete query.search;

  if (pokemonIds.length > 0) {
    pokemonIds = pokemonIds.filter((item, index) => pokemonIds.indexOf(item) === index);
    filter.id = { $in: pokemonIds };
  }
  else if (pokemonIdsUsed) {
    filter.id = { $in: [0] }
  }

  for (const [key, value] of Object.entries(query)) {
    if (arrayFields.includes(key)) {
      filter[key] = { $all: Array.isArray(value) ? value : [value] };
    } else if (booleanFields.includes(key)) {
      filter[key] = value === "true";
    } else if (intFields.includes(key)) {
      filter[key] = Number(value);
    } else {
      filter[key] = value;
    }
  }

  if (dual != undefined) {
    filter = await handlers.handlerDualTypes(parseInt(dual), filter);
  }
  if (max_generation != undefined) {
    filter = await handlers.handleMaxGeneration(parseInt(max_generation), filter);
  }
  if (search != undefined) {
    filter = await handlers.handleSearch(search, filter);
  }
  let pokemons = await db.db.collection('pokemon_test').find(filter, { projection: 
      { name: 1, id: 1, species_name: 1, dex_number: 1, 
        sprite_default: 1, sprite_shiny: 1, cry: 1, 
        isActive: 1, _id: 0 } })
      .sort({ dex_number: 1, id: 1 }).toArray();
  
  pokemons = pokemons.filter(p => p.isActive !== false);
  return pokemons;
}

export async function findPuzzlesOfSameDate(existingPuzzle, Puzzle) {
  const puzzlesByChallenge = {};

  if (!existingPuzzle) return puzzlesByChallenge;

  if (!existingPuzzle.date) {
    puzzlesByChallenge[existingPuzzle.challenge ?? '4'] = existingPuzzle._id;
    return puzzlesByChallenge;
  }

  const puzzles = await Puzzle.find({ date: existingPuzzle.date });

  puzzles.forEach(puzzle => {
    puzzlesByChallenge[puzzle.challenge ?? '4'] = puzzle._id;
  });

  return puzzlesByChallenge;
}