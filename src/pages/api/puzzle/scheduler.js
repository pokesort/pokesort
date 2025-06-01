import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';

export default async function handler(req, res) {

  const Puzzle = getPuzzleModel(data);
  
  const today = new Date().toISOString().split('T')[0];
  let existingPuzzle = await getTodayPuzzle(today);

  if(!existingPuzzle) return res.status(404).json({success: false, message: "Nenhum puzzle disponível"});
    
  return res.status(200).json({success: true})
}

async function getTodayPuzzle(today){

  let todayPuzzle = await data.db.collection('puzzles').findOne({date: today});

  if (!todayPuzzle){

    const puzzleNoDate = await data.db.collection('puzzles').findOne({ date: null });
    
    if (puzzleNoDate) {
      await data.db.collection('puzzles').updateOne(
        { _id: puzzleNoDate._id },
        { $set: { date: today } }
      );

      todayPuzzle = { ...puzzleNoDate, date: today };
    }
  }

  return todayPuzzle;
}