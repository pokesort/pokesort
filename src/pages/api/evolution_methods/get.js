import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    const evolution_methods = await db.db.collection('evolution_methods').find({}).toArray();

    res.status(200).json({ success: true, evolution_methods: evolution_methods.map((col) => col.name) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}