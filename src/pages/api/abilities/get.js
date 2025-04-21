import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connect();
    
    const abilities = await data.db.collection('abilities').find({}).toArray();

    res.status(200).json({ success: true, abilities: abilities.map((col) => col.name) });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {

  }
}