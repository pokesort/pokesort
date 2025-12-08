import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    const db = getDb();

    let notices = await db.db.collection('notices').find({}).sort({ created_at: -1 }).toArray();

    res.status(200).json({ success: true, notices });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}