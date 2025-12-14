import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const { id } = req.query
    const type = await db.db.collection("types").findOne({ $or: [{ "id": id }, { "name": id }] });

    if (!type) {
      res.status(404).json({ success: false, error: "Tipo não encontrado" })
    }
    res.status(200).json({ success: true, type: type.name, id: type.id });

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}