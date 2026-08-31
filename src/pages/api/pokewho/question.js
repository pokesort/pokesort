import { connect, getDb } from "@/lib/mongodb";
import { filterPokemons } from "../../../scripts/server_utils";

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { secretId, ids, query } = req.body;

        const queryPokemons = (await filterPokemons(query)).map(pokemon => pokemon.id);
        const matchingIds = ids.filter(id => queryPokemons.includes(id));

        return res.status(200).json({ success: true, query, secretId, matchingIds, queryPokemons });
    } catch (error){
        return res.status(500).json({success: false, message: "Internal Server Error"});
    }
}