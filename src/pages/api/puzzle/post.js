import { connect } from "@/lib/mongodb";
import { Puzzle } from "../../../models/puzzle";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        await connect();

        const { groups, date, origin, author } = req.body;

        if (!groups || !Array.isArray(groups) || groups.length < 4 || groups.length > 5) {
            return res.status(400).json({ success: false, error: "groups must be an array of 4 to 5 ids" });
        }

        if (!["system", "admin", "user"].includes(origin)) {
            return res.status(400).json({ success: false, error: "origin must be 'system', 'admin' or 'user'" });
        }

        if (!author || typeof author !== "string") {
            return res.status(400).json({ success: false, error: "Author must be a string" });
        }

        const puzzle = await Puzzle.create({
            groups,
            date: date || null,
            origin,
            author
        });

        return res.status(201).json({ success: true, puzzle });
    } catch (error) {
        console.error("Failed to create Grupo:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}