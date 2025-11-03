import { connect, getDb } from "@/lib/mongodb";
import { getPuzzleModel } from '@/src/models/Puzzle';

export default async function handler(req, res) {

  await connect();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connect();
    const conn = getDb();
    const Puzzle = getPuzzleModel(conn);

    const puzzle = new Puzzle(req.body);

    await puzzle.validate();

    if (puzzle.date) {
      const existing = await Puzzle.findOne({ date: puzzle.date });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Já existe um puzzle com esta data.' });
      }
    }
    const savedPuzzle = await puzzle.save();

    return res.status(201).json({ success: true, data: savedPuzzle });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    console.error('Internal error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
