import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const { id } = req.query
    const move = await db.db.collection("moves").findOne({ $or: [{ "id": id }, { "name": id }] });

    if (!move) {
      res.status(404).json({ success: false, error: "Movimento não encontrado" })
    }
    res.status(200).json({ success: true, move: move });

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}