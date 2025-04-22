import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    
    const types = await data.db.collection("types").find({}).toArray();

    res.status(200).json({ success: true, types: types.map((col) => col.name) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}