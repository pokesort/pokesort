import { connect, data } from "@/lib/mongodb";
import { getPuzzleModel } from "@/src/models/Puzzle";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    
    await connect();
    const Puzzle = getPuzzleModel(data);

    const puzzles = req.body;

    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      return res.status(400).json({ success: false, error: 'Body must be a non-empty array of puzzles.' });
    }

    for (const puzzle of puzzles) {
      const instance = new Puzzle(puzzle);
      await instance.validate();
    }

    const savedPuzzles = await Puzzle.insertMany(puzzles);
    return res.status(201).json({ success: true, data: savedPuzzles });
    
    // return res.status(200).json({ success: true, puzzles });

    
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    console.error('Erro interno:', error);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}