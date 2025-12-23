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
    await update(req, res, existingPuzzle);
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

async function update(req, res, existingPuzzle) {
  try {
    await connect();

    const { password, puzzle } = req.body;
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