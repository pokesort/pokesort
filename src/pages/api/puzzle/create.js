import { connect, getDb } from "@/lib/mongodb";
import { getPuzzleModel } from '@/src/models/Puzzle';

export default async function handler(req, res) {

  await connect();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password, puzzle } = req.body;
  if (password != process.env.NEXT_PUBLIC_API_AUTHORIZATION_BATCH)
    return res.status(403).json({ success: false, message: "Usuário não permitido" });

  try {
    await connect();
    const conn = getDb();
    const Puzzle = getPuzzleModel(conn);

    const new_puzzle = new Puzzle(puzzle);
    new_puzzle.groups.map(g => {
      g.pokemons = g.pokemons.slice(0, new_puzzle.cols);
      return g;
    });

    await new_puzzle.validate();

    // if (puzzle.date) {
    //   const existing = await Puzzle.findOne({ date: puzzle.date });
    //   if (existing) {
    //     return res.status(400).json({ success: false, error: 'Já existe um puzzle com esta data.' });
    //   }
    // }
    const savedPuzzle = await new_puzzle.save();

    return res.status(201).json({ success: true, data: savedPuzzle });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Internal error:', error);
    return res.status(500).json({ success: false, message: 'Ocorreu um erro interno do servidor' });
  }
}
