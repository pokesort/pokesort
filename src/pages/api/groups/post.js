import { connect } from "@/lib/mongodb";
import { Group } from "../../../models/Group";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connect();

    const { pokemons, categories } = req.body;

    if (!pokemons || !Array.isArray(pokemons) || pokemons.length < 4 || pokemons.length > 6) {
      return res.status(400).json({ success: false, error: "Pokemons must be an array of 4 to 6 ids" });
    }

    const group = await Group.create({
      pokemons,
      categories
    });
    
    return res.status(201).json({ success: true, group });
  } catch (error) {
    console.error("Failed to create Grupo:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}