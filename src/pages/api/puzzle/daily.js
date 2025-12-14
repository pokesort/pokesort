import { connect, getDb } from "@/lib/mongodb";
import { getPuzzleModel } from '@/src/models/Puzzle';
import { populate } from './_utils';
import { findPuzzlesOfSameDate } from '@/src/scripts/server_utils';

export default async function handler(req, res) {
  await connect();

  const { challenge } = req.query;
  
  const today = new Date().toISOString().split('T')[0];
  const conn = getDb();
  const Puzzle = getPuzzleModel(conn);
  let existingPuzzle = await getTodayPuzzle(today, Number(challenge) ?? null);
  
  if (!existingPuzzle) {
    return res.status(404).json({ success: false, error: 'Puzzle not found' });
  }

  if (req.method === 'GET'){
    existingPuzzle.daily = true;
    const challenges = await findPuzzlesOfSameDate(existingPuzzle, Puzzle);
    const dictionary = await populate(res, existingPuzzle);
    
    return res.status(200).json({success: true, data: existingPuzzle, dictionary: dictionary, challenges: challenges})
  }

}

async function getTodayPuzzle(today, challenge=null){

  const db = getDb();
  const puzzles = db.db.collection('puzzles');
  const findPuzzle = async (date, challenge) => {
      let loop;    
      const query = {date: date};
      if (challenge != null) query["challenge"] = challenge;
      loop = await puzzles.findOne(query);
      if (!loop) {
        loop = await puzzles.findOne({date: date});
      }
      return loop;
  }

  let todayPuzzle = await findPuzzle(today, challenge);
  if (!todayPuzzle) { // Caso não encontre o puzzle de hoje, volte dia por dia até achar um
    let date = Date.now();
    while (!todayPuzzle) {
      date = new Date(date - 86400000);
      todayPuzzle = await findPuzzle(date.toISOString().split('T')[0], challenge);
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