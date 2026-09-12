import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
    try {

        if (req.method !== "POST") {
            return res.status(405).json({ success: false, error: "Método não permitido", });
        }

        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: "É necessário informar uma lista de IDs", });
        }

        const numericIds = ids.map(Number);

        if (numericIds.some(Number.isNaN)) {
            return res.status(400).json({ success: false, error: "Todos os IDs devem ser números", });
        }

        await connect();

        const db = getDb();

        const pokemons = await db.db.collection("pokemon").find(
            { id: { $in: numericIds } },
            {
                projection: {
                    _id: 0,
                    id: 1,
                    name: 1,
                    types: 1,
                    region: 1,
                    generation: 1,
                    color: 1,
                    shape: 1,
                    egg_groups: 1,
                    abilities: 1,
                    moves: 1,
                },
            }
        ).toArray();

        return res.status(200).json({
            success: true,
            pokemons,
        });
    } catch (error) {
        console.error("Connection failed:", error);

        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}