import { connect, getDb } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';
import { generateTips } from '../../../scripts/utils';
import mongoose from 'mongoose';
import { populate } from './_utils';
import { findPuzzlesOfSameDate } from '@/src/scripts/server_utils';

export default async function handler(req, res) {
  await connect();
  
  const { id, daily, challenge } = req.query;
  const db = getDb();
  const Puzzle = getPuzzleModel(db);

  let existingPuzzle;
  const today = new Date().toISOString().split('T')[0];
  const date = new Date(`${id}T00:00:00`);
  
  if (!isNaN(date) && date <= Date.now()) {
    const query = {'date': id};
    if (challenge) query['challenge'] = challenge;

    existingPuzzle = await Puzzle.findOne(query);

    if (!existingPuzzle) {
        existingPuzzle = await Puzzle.findOne({ date: id });
    }
  } else if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  if (!existingPuzzle) {
    existingPuzzle = await Puzzle.findById(id);
  }
  if (!existingPuzzle) {
    return res.status(404).json({ success: false, error: 'Puzzle not found' });
  }

  if (req.method === 'PUT') {
    const { password, puzzle } = req.body;
    if (password != process.env.NEXT_PUBLIC_API_AUTHORIZATION_BATCH) return res.status(403).json({ success: false, message: "Usuário não permitido" });
    
    const samePuzzle = await Puzzle.findOne({ date: puzzle.date, challenge: puzzle.challenge, _id: { $ne: existingPuzzle._id } });
    if (samePuzzle && samePuzzle.date != null) return res.status(403).json({ success: false, message: "Já existe um puzzle com essa data e nível de desafio" });
    
    await update(puzzle, res, existingPuzzle);
  }
  else if (req.method === 'DELETE') {
    await remove(res, existingPuzzle);
  }
  else if (req.method === 'GET'){
    const puzzleObject = existingPuzzle.toObject();
    puzzleObject.daily = daily == "true" || puzzleObject.date == today;
    const challenges = await findPuzzlesOfSameDate(existingPuzzle, Puzzle);
    const dictionary = await populate(res, existingPuzzle);
    return res.status(200).json({success: true, data: puzzleObject, dictionary: dictionary, challenges: challenges})
  }
}

async function update(puzzle, res, existingPuzzle) {
  try {
    await connect();

    puzzle.groups = puzzle.groups.slice(0, puzzle.rows);
    puzzle.groups.map(g => {
      g.pokemons = g.pokemons.slice(0, puzzle.cols);
      g.tips = generateTips(g.pokemons, g.query);
      return g;
    });
    Object.assign(existingPuzzle, puzzle);

    await existingPuzzle.validate();
    const updatedPuzzle = await existingPuzzle.save();

    return res.status(200).json({ success: true, data: updatedPuzzle });
  }
  catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Update error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function remove(res, existingPuzzle) {
  try {
    await existingPuzzle.deleteOne();

    return res.status(200).json({ success: true, message: 'Puzzle deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}