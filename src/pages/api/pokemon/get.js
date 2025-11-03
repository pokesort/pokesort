import { connect } from "@/lib/mongodb";
import { filterPokemons } from "../../../scripts/server_utils";

export default async function handler(req, res) {
  try {
    await connect();
    let pokemons = await filterPokemons({ ...req.query });

    res.status(200).json({ success: true, pokemons });
  } catch (error) {
    console.error("Connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}