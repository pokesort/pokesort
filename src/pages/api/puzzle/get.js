import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const objectKey = req.query.by;

    let query = objectKey == 'date' ? { date: { $ne: null } } : {};
    let puzzles = await db.db.collection('puzzles').find(query).sort({ date: 1 }).toArray();

    switch (objectKey) {
      case 'date':
        const puzzlesByDate = puzzles.reduce((acc, puzzle) => {
          if (puzzle.date) {
            acc[puzzle.date] = puzzle._id;
          }
          return acc;
        }, {});
        res.status(200).json({ success: true, puzzles: puzzlesByDate });
      default:
        res.status(200).json({ success: true, puzzles });
    }
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}