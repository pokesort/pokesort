import { connect, data } from "@/lib/mongodb";

import { validateGenerateParams } from "@/src/scripts/utils";
import { createPuzzleFieldManager, generateUniqueQuery } from "@/src/scripts/puzzleManager";
import { filterPokemons } from "../../../scripts/server_utils";

export default async function handler(req, res) {

  try {

    const validatedParams = validateGenerateParams(req.query);
    if (validatedParams.error) {
      return res.status(validatedParams.status).json({ error: validatedParams.error });
    }
    const { amount, rows, cols, challenge, generation } = validatedParams;

    await connect();

    const puzzles = [];
    const fieldManager = createPuzzleFieldManager(challenge);

    for (let i = 0; i < amount; i++) {
      const puzzle = await generatePuzzle(rows, cols, challenge, fieldManager, generation);
      puzzles.push(puzzle);
    }

    return res.status(200).json({
      message: 'Parâmetros validados com sucesso',
      data: {
        amount,
        challenge,
        rows,
        cols,
        generation
      },
      puzzles: puzzles,
    });

  } catch (error) {
    console.error('Erro ao gerar puzzle:', error);
    return res.status(500).json({ error: 'Erro ao gerar puzzle' });
  }
}

export async function generatePuzzle(rows, cols, challenge, fieldManager, generation) {
  const groups = [];
  for (let i = 0; i < rows; i++) {
    const group = await generateGroup(cols, challenge, fieldManager, generation);
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
}

export async function generateGroup(cols, challenge, fieldManager, generation) {

  const query = generateUniqueQuery(fieldManager);
  fieldManager.markQueryAsUsed(query);

  const params = new URLSearchParams(query);
  if (generation) {
    params.set('max_generation', generation);
  }
  const queryObject = Object.fromEntries(params.entries());

  console.log(queryObject);
  
  const pokemons = await filterPokemons(queryObject);
  const ids = pokemons.map(p => p.id);
  console.log(ids);


  const group = {
    query: query,
    pokemons: [],
    tips: [],
  };

  return group;
}
