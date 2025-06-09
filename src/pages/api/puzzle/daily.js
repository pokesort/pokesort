import { connect, data } from '@/lib/mongodb';
import { getPuzzleModel } from '@/src/models/Puzzle';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // Esta rota deve encontrar o puzzle com a data de hoje.
  // Usando um id fixo para testes

  await connect();

  const id = '6814d35057d11f3951d361d6';

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  const Puzzle = getPuzzleModel(data);
  
  const today = new Date().toISOString().split('T')[0];
  let existingPuzzle = await getTodayPuzzle(today);
  
  // existingPuzzle = await Puzzle.findById(id);
  if (!existingPuzzle) {
    return res.status(404).json({ success: false, error: 'Puzzle not found' });
  }

  if (req.method === 'GET'){
    await show(res, existingPuzzle);
  }

}

async function show(res, existingPuzzle){
  const populatedMons = await Promise.all(
    existingPuzzle.groups.map(async (group) => {
      return await data.db.collection('pokemon').find({ id: { $in: group.pokemons }}, { projection: { name: 1, id: 1, species_name: 1, dex_number: 1, _id: 0 } }).toArray();
    })
  );

  return res.status(200).json({success: true, data: existingPuzzle, pokemon: populatedMons.flat()})
}

async function getTodayPuzzle(today){

  let todayPuzzle = await data.db.collection('puzzles').findOne({date: today});

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