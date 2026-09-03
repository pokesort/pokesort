import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const objectKey = req.query.by;
    const limit = req.query.limit || 0;

    let puzzles = await orderPuzzles(db, objectKey, limit);

    switch (objectKey) {
      case 'date':
        const puzzlesByDate = puzzles.reduce((acc, puzzle) => {
          if (puzzle.date) {
            acc[puzzle.date] = acc[puzzle.date] || [];
            acc[puzzle.date].push(puzzle._id);
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

const orderPuzzles = async (db, objectKey, limit) => {
  switch (objectKey) {
    case 'date':
      const parsedLimit = Number(limit) || 0;

      const pipeline = [
        { $match: { date: { $ne: null } } },
        { $sort: { date: -1 } },
        {
          $group: {
            _id: '$date',
            puzzles: { $push: '$$ROOT' },
          },
        },
        { $sort: { _id: -1 } },
        ...(parsedLimit > 0 ? [{ $limit: parsedLimit }] : []),
        { $unwind: '$puzzles' },
        { $replaceRoot: { newRoot: '$puzzles' } },
        { $sort: { date: 1 } },
      ];

      return await db.db.collection('puzzles').aggregate(pipeline).toArray();
    default:
      return await db.db.collection('puzzles')
      .aggregate([
        {
          $addFields: {
            hasDate: { $cond: [{ $ifNull: ['$date', false] }, 1, 0] }
          }
        },
        {
          $sort: {
            hasDate: 1,
            date: -1
          }
        }
      ])
      .toArray();
  }  
}