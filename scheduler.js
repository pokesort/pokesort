import cron from 'node-cron';
import { connect, getDb } from './lib/mongodb.js';

async function atualizarPuzzleDiario() {

  const today = new Date().toISOString().split('T')[0];
  const db = getDb();
  const puzzles = db.db.collection('puzzles');

  try {
    let existingPuzzle = await puzzles.findOne({ date: today });

    if (!existingPuzzle) {
      const semData = await puzzles.findOne({ date: null });

      if (semData) {
        await puzzles.updateOne(
          { _id: semData._id },
          { $set: { date: today } }
        );
        console.log(`[${today}] Puzzle sem data atualizado com a data de hoje.`);
      } else {
        console.log(`[${today}] Nenhum puzzle sem data disponível.`);
      }
    } else {
      console.log(`[${today}] Puzzle diário já existe.`);
    }
  } catch (err) {
    console.error('Erro ao atualizar puzzle:', err);
  }
}

await connect();

cron.schedule('* * * * *', () => {
  console.log('⏰ Rodando tarefa de teste...');
  atualizarPuzzleDiario();
});
