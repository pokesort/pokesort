import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const { id } = req.query
    const pokemon = await db.db.collection("pokemon_test").findOne({ $or: [{ "id": Number(id) }, { "name": id }] });

    if (!pokemon) {
      res.status(404).json({ success: false, error: "Pokemon não encontrado" })
    }
    res.status(200).json({ success: true, pokemon: pokemon });

  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}