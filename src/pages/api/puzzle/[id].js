import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '../../../models/Puzzle';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  const Puzzle = getPuzzleModel(data);

  const existingPuzzle = await Puzzle.findById(id);
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
    await show(res, existingPuzzle);
  }


}

async function show(res, existingPuzzle){
  return res.status(200).json({success: true, data: existingPuzzle})
}

async function update(req, res, existingPuzzle) {
  try {
    await connect();

    Object.assign(existingPuzzle, req.body);

    await existingPuzzle.validate();
    const updatedPuzzle = await existingPuzzle.save();

    return res.status(200).json({ success: true, data: updatedPuzzle });
  }
  catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    console.error('Update error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

async function remove(res, existingPuzzle) {
  try {
    await existingPuzzle.deleteOne();

    return res.status(200).json({ success: true, message: 'Puzzle deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}