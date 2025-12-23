import { connect, getDb } from "@/lib/mongodb";
import { validateGenerateParams, pickRandomMult, generateTips } from "@/src/scripts/utils";
import { createPuzzleFieldManager, generateUniqueQuery } from "@/src/scripts/puzzleManager";
import { filterPokemons } from "@/src/scripts/server_utils";
import { populate } from "./_utils";
import { NotEnoughFieldsError, MaxAttemptsError } from "../../../scripts/erros";

export default async function handler(req, res) {

  try {
    const validatedParams = validateGenerateParams(req.query);
    if (validatedParams.error) {
      return res.status(validatedParams.status).json({ error: validatedParams.error });
    }
    const { amount, rows, cols, challenge, generation, infinite } = validatedParams;

    await connect();
    getDb();

    const puzzles = [];
    let fieldManager = createPuzzleFieldManager(challenge);
    let { excludeFields } = req.body || {};
    if (excludeFields) {
      const list = Array.isArray(excludeFields) ? excludeFields : [excludeFields];
      for (const f of list) {
        if (f in fieldManager.availableFields) {
          fieldManager.markFieldAsUsed(f);
        }
      }
    }

    for (let i = 0; i < amount; i++) {
      const puzzle = await generatePuzzle(rows, cols, challenge, fieldManager, generation);

      puzzles.push(puzzle);
      fieldManager.reset();
    }

    if (infinite) {
      const dictionary = await populate(res, puzzles[0]);
      const challenges = {};
      challenges[puzzles[0].challenge] = "true";
      return res.status(200).json({ success: true, data: puzzles[0], dictionary: dictionary, challenges: challenges });
    }

    return res.status(200).json({
      puzzles: puzzles,
    });

  } catch (error) {
    console.error('Erro ao gerar puzzle:', error);
    return res.status(500).json({ error: error, message: error.message });
  }
}

export async function generatePuzzle(rows, cols, challenge, fieldManager, generation) {

  try {
    const totalCombinations = countCombinations(fieldManager.getAvailableFields(), generation);
    if (totalCombinations < rows) throw new NotEnoughFieldsError('Não existem campos suficientes para gerar o puzzle.');
    
    const groups = [];
    const idsUsed = [];
    for (let i = 0; i < rows; i++) {
      const group = await generateGroup(cols, fieldManager, generation, idsUsed);
      groups.push(group);
    }
    const puzzle = {
      author: 'admin',
      from: 'system',
      challenge,
      groups,
      rows,
      cols,
    };
    return puzzle;
  } catch(error){
    throw error;
  }
}

export async function generateGroup(cols, fieldManager, generation, idsUsed) {

  let ids = [];
  let query = '';
  const maxAttempts = 50;
  let attempts = 0;

  while (ids.length < cols) {
    query = generateUniqueQuery(fieldManager);
    if (!query) {
      if (attempts < maxAttempts) {
        attempts++;
        continue;
      } else {
        throw new MaxAttemptsError('Máximo de tentativas alcançado, tente de novo');
      }
    }

    const params = new URLSearchParams(query);
    if (generation) {
      params.set('max_generation', generation);
    }
    const queryObject = Object.fromEntries(params.entries());

    const pokemons = await filterPokemons(queryObject);
    ids = pokemons.map(p => p.id);
    ids = ids.filter(id => !idsUsed.includes(id));
    attempts++;
  }
  fieldManager.markQueryAsUsed(query);
  const pokemonIds = pickRandomMult(ids, cols);
  idsUsed.push(...pokemonIds);
  query = '?' + query;
  const tips = generateTips(pokemonIds, query);
  const group = {
    query: query,
    pokemons: pokemonIds,
    tips: tips,
  };

  return group;
}

function countCombinations(challengeFields, generation) {
  let total = 1;

  for (const [key, value] of Object.entries(challengeFields)) {
    
    if (key === "generation")
    {
      total *= generation;
      continue;
    } 

    if (value && typeof value === "object" && "min" in value && "max" in value) {
      total *= (value.max - value.min + 1);
    }

    else if (Array.isArray(value)) {
      total *= value.length;
    }
  }

  return total;
}
