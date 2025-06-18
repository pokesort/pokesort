import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';
import { populate } from './_utils';

export default async function handler(req, res) {
  await connect();

  const Puzzle = getPuzzleModel(data);
  
  const today = new Date().toISOString().split('T')[0];
  let existingPuzzle = await getTodayPuzzle(today);
  
  if (!existingPuzzle) {
    return res.status(404).json({ success: false, error: 'Puzzle not found' });
  }

  if (req.method === 'GET'){
    const dictionary = await populate(res, existingPuzzle);
    return res.status(200).json({success: true, data: existingPuzzle, dictionary: dictionary})
  }

}

async function getTodayPuzzle(today){

  let todayPuzzle = await data.db.collection('puzzles').findOne({date: today});
  if (!todayPuzzle) { // Caso não encontre o puzzle de hoje, volte dia por dia até achar um
    let date = Date.now();
    while (!todayPuzzle) {
      date = new Date(date - 86400000);
      todayPuzzle = await data.db.collection('puzzles').findOne({date: date.toISOString().split('T')[0]});
    }
  }

  // if (!todayPuzzle){

  //   const puzzleNoDate = await data.db.collection('puzzles').findOne({ date: null });
    
  //   if (puzzleNoDate) {
  //     await data.db.collection('puzzles').updateOne(
  //       { _id: puzzleNoDate._id },
  //       { $set: { date: today } }
  //     );

  //     todayPuzzle = { ...puzzleNoDate, date: today };
  //   }
  // }

  return todayPuzzle;
}