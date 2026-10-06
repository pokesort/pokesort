import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const { id } = req.query
    const ability = await db.db.collection("abilities").findOne({ $or: [{ "id": id }, { "name": id }] });

    if (!ability) {
      res.status(404).json({ success: false, error: "Habilidade não encontrada" })
    }
    res.status(200).json({ success: true, ability: ability });

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}