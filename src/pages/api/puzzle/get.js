import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();

    let puzzles = await data.db.collection('puzzles').find({}).toArray();

    res.status(200).json({ success: true, puzzles });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}