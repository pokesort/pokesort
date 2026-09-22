import { connect, getDb } from "@/lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        await connect();
        const db = getDb();
        const collection = db.db.collection("pokemon");

        const { pokemon, field, value, password } = req.body;

        if (password != process.env.AUTHORIZATION_BATCH)
            return res.status(403).json({ success: false, message: "Usuário não permitido" });

        if (!Array.isArray(pokemon) || pokemon.length === 0)
            return res.status(400).json({ success: false, error: 'Body must be a non-empty array of pokemon.' });

        if (typeof field !== "string" || !field.trim())
            return res.status(400).json({ success: false, error: "Field must be a non-empty string." });

        if (typeof value !== "string" || !value.trim())
            return res.status(400).json({ success: false, error: "Value must be a non-empty string." });

        const arrayFields = [
            "types",
            "moves",
            "egg_groups",
            "categories",
            "abilities",
            "other_forms"
        ];

        const errors = [];

        for (const pokemonName of pokemon) {
            try {
                const filter = typeof pokemonName === "number"
                    ? { id: pokemonName }
                    : { name: pokemonName.toLowerCase() };

                const update = arrayFields.includes(field)
                    ? { $addToSet: { [field]: value } }
                    : { $set: { [field]: value } };

                const result = await collection.updateOne(filter, update);

                if (result.matchedCount === 0) {
                    console.error(`Pokémon não encontrado: ${pokemonName}`);
                    errors.push(`${pokemonName}: Pokémon não encontrado`);
                }
            } catch (error) {
                console.error(`Erro ao atualizar ${pokemonName}:`, error);
                errors.push(`${pokemonName}: erro ao atualizar`);
            }
        }

        return res.status(200).json({
            success: true,
            pokemon,
            field,
            value,
            errors
        });
    } catch (error) {
        console.error('Erro Interno: ', error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}