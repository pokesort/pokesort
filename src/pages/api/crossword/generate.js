import { connect, getDb } from "@/lib/mongodb";
import {initializeCrossword, getWords, findCandidatePlacements} from "./_steps";

export default async function handler(req, res) {

    // if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    try {

        // await connect();
        // const db = getDb();

        const MIN_SIZE = 7;
        const MAX_SIZE = 12;
        const AMOUNT = 30;

        //Se necessario, receber do body
        const query = req.query || {};

        //Step 1: Get words from the database based on the query and amount
        const words = await getWords(query, AMOUNT);
        
        //Step 2: Get the crossword grid, placements, and selected words based on the words and max size
        const {selectedWords, grid, placements} = initializeCrossword(words, MIN_SIZE);

        //Substep: Create a map of answers for easy access
        const answerMap = new Map(selectedWords.map((word) => [word.id, word]));
        const nextWord = selectedWords[1];
        
        //Step 3: Find candidate placements for the next word
        const candidates = findCandidatePlacements(grid, placements, answerMap, nextWord);

        return res.status(200).json({ grid, placements, candidates });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        res.status(500).json({ error: "Failed to connect to the database" });
    }
}
