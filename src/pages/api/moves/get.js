import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    const filter = {}
    if(req.query.type_id) filter['type_id'] = req.query.type_id
    
    const moves = await data.db.collection('moves').find(filter).toArray();

    res.status(200).json({ success: true, moves: moves.map((col) => col.name) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}