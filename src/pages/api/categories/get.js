import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    
    const categories = await data.db.collection('categories').find({}).toArray();

    res.status(200).json({ success: true, categories: categories.map((col) => [col.name, col.display]) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}