import { connect, getDb } from "@/lib/mongodb";
import { getPuzzleModel } from '@/src/models/Puzzle';
import { generatePuzzle } from './generate';
import { createPuzzleFieldManager } from "@/src/scripts/puzzleManager";
import { validateGenerateParams, FIELD_OPTIONS } from "@/src/scripts/utils";

export default async function handler(req, res) {
  try {
    await connect();

    const conn = getDb();
    const Puzzle = getPuzzleModel(conn);

    const today = new Date().toISOString().split('T')[0];
    let existingPuzzle = await getTodayPuzzle(today, Puzzle);

    if(existingPuzzle) return res.status(200).json({message: "Puzzle(s) para hoje encontrado(s)"});

    const puzzles = [];
    const { password } = req.body;

    for (let i = 1; i <= 4; i++) {
      const validatedParams = validateGenerateParams({amount:1, challenge:i, password:password});
      if (validatedParams.error) {
        
        return res.status(validatedParams.status).json({ error: validatedParams.error });
      }
      const { rows, cols, challenge } = validatedParams;
      const fieldManager = createPuzzleFieldManager(i);

      const generation = FIELD_OPTIONS.generation.max;
      let puzzle = await generatePuzzle(rows, cols, challenge, fieldManager, generation);
      puzzle.date = today ;
      puzzles.push(puzzle);
    }

    const result = await batchPuzzles(puzzles, Puzzle);
    return res.status(200).json(puzzles);

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

async function batchPuzzles(puzzles, Puzzle) {
  
  try {
    for (const puzzle of puzzles) {
      if (!puzzle.groups || !Array.isArray(puzzle.groups)) {
        throw new Error('Puzzle inválido: grupos não encontrados');
      }
      const instance = new Puzzle(puzzle);
      await instance.validate();
    }

    const savedPuzzles = await Puzzle.insertMany(puzzles);

    return {
      success: true,
      message: `${savedPuzzles.length} puzzles processados com sucesso`,
      // puzzles: savedPuzzles
    };
  } catch (error) {
    console.error('Erro ao processar puzzles:', error);
    return {
      success: false,
      error: error.message
    };
  }
}