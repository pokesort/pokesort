import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';

export default async function handler(req, res) {

  try {
    await connect();
  
    const Puzzle = getPuzzleModel(data);
    
    const today = new Date().toISOString().split('T')[0];
    let existingPuzzle = await getTodayPuzzle(today, Puzzle);
  
    if(!existingPuzzle) return res.status(404).json({success: false, message: "Nenhum puzzle disponível"});
      
    return res.status(200).json({success: true})
  } catch (error) {
    console.log(error);
    return res.status(500).json({success: false, message: "Erro interno de Servidor"})
  }
}

async function getTodayPuzzle(today, Puzzle){

  let todayPuzzle = await Puzzle.findOne({date: today});

  if (!todayPuzzle){

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