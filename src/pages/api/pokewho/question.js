import { connect, getDb } from "@/lib/mongodb";
import { filterPokemons } from "../../../scripts/server_utils";

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { secretId, pokemons, query } = req.body;

        const queryIds = new Set((await filterPokemons(query)).map(pokemon => pokemon.id));

        const secretFound = queryIds.has(secretId);

        const updatedPokemons = pokemons.map(pokemon => ({
            ...pokemon,
            available: secretFound
                ? queryIds.has(pokemon.id)
                : !queryIds.has(pokemon.id)
        }));
        
        return res.status(200).json({ success: true, secretFound: secretFound, updatedPokemons });
    } catch (error){
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
}