import { connect, data } from "@/lib/mongodb";

import { validateGenerateParams } from "@/src/scripts/utils";

export default async function handler(req, res) {

  try {

    const validatedParams = validateGenerateParams(req.query);
    if (validatedParams.error) {
      return res.status(validatedParams.status).json({ error: validatedParams.error });
    }
    const { amount, rows, cols, challenge } = validatedParams;

    await connect();

    const puzzles = [];

    for (let i = 0; i < amount; i++) {
      const puzzle = await generatePuzzle(rows, cols, challenge);
      puzzles.push(puzzle);
    }

    return res.status(200).json({
      message: 'Parâmetros validados com sucesso',
      data: {
        amount,
        challenge,
        rows,
        cols,
      },
      puzzles: puzzles,
    });

  } catch (error) {
    console.error('Erro ao gerar puzzle:', error);
    return res.status(500).json({ error: 'Erro ao gerar puzzle' });
  }
}

export async function generatePuzzle(rows, cols, challenge) {
  const groups = [];
  for (let i = 0; i < rows; i++) {
    const group = await generateGroup(cols, challenge);
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

export async function generateGroup(cols, challenge) {
  const group = {
    query: '',
    pokemons: [],
    tips: [],
  };
  return group;
}
