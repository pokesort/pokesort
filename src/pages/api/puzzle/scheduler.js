import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';
import { generatePuzzle } from './generate';

export default async function handler(_, res) {

  try {
    await connect();

    const Puzzle = getPuzzleModel(data);

    const today = new Date().toISOString().split('T')[0];
    let existingPuzzle = await getTodayPuzzle(today, Puzzle);
    const puzzles = [];

    for (let i = 1; i <= 4; i++) {
      // Gerar puzzle diretamente usando a função
      const puzzle = await generatePuzzle(4, 4, i, null, null, []);
      console.log('Puzzle: ' + JSON.stringify(puzzle, null, 2));
      puzzles.push(puzzle);
    }
    console.log("Puzzle Array: " + JSON.stringify(puzzles, null, 2));

    const result = await batchPuzzles(puzzles);
    return res.status(200).json(result);

    // if (!existingPuzzle) return res.status(404).json({ success: false, message: "Nenhum puzzle disponível" });

    // return res.status(200).json({ success: true })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Erro interno de Servidor" })
  }
}

async function getTodayPuzzle(today, Puzzle) {

  return null;
  let todayPuzzle = await Puzzle.findOne({ date: today });

  if (!todayPuzzle) {

    const puzzleNoDate = await Puzzle.findOne({ date: null });

    if (puzzleNoDate) {
      await Puzzle.updateOne(
        { _id: puzzleNoDate._id },
        { $set: { date: today } }
      );

      todayPuzzle = { ...puzzleNoDate, date: today };
    }
  }

  return todayPuzzle;
}

async function batchPuzzles(puzzles) {
  console.log("Scheduler: " + JSON.stringify(puzzles, null, 2));

  try {
    // Validar os puzzles
    for (const puzzle of puzzles) {
      // Aqui você pode adicionar validações específicas se necessário
      if (!puzzle.groups || !Array.isArray(puzzle.groups)) {
        throw new Error('Puzzle inválido: grupos não encontrados');
      }
    }

    // Simular o que a API batch faria
    return {
      success: true,
      message: `${puzzles.length} puzzles processados com sucesso`,
      puzzles: puzzles
    };
  } catch (error) {
    console.error('Erro ao processar puzzles:', error);
    return {
      success: false,
      error: error.message
    };
  }
}