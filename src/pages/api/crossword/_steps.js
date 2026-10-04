import * as utils from "./_utils";
import { isValidPlacement } from "./_validation";

export async function getWords(query, amount){
    
    const pokemons = await utils.getCrosswordPokemons(query, amount);

    const words = pokemons
            .map((pokemon) => ({
                id: pokemon.id,
                speciesName: pokemon.speciesName,
                answer: utils.sanitizeSpeciesName(pokemon.speciesName)
            })).sort((a, b) => {
                const lengthDiff = b.answer.length - a.answer.length;
                if (lengthDiff !== 0) return lengthDiff;

                return Math.random() - 0.5;
            });

    return words;
}

export function initializeCrossword(words, size) {
    
    const selectedWords = utils.getWordsForGrid(words, size);

    if (selectedWords.length === 0) throw new Error("No words available for crossword");

    const grid = utils.createEmptyGrid(size);
    const placements = [];

    const anchor = selectedWords[0];
    const anchorPlacement = utils.createAnchorPlacement(anchor, size);

    utils.placeWord(grid, anchor, anchorPlacement);
    placements.push(anchorPlacement);

    return {
        selectedWords,
        grid,
        placements
    };
}

export function findCandidatePlacements(grid, placements, answerMap, answer) {

    const intersections = utils.findIntersections(grid, answer.answer);
    const candidates = [];

    for (const intersection of intersections) {
        const existingPlacements = utils.getPlacementsAtCell(
            placements,
            answerMap,
            intersection.row,
            intersection.col
        );

        for (const existingPlacement of existingPlacements) {
            const placement = utils.createIntersectionPlacement(
                intersection,
                existingPlacement,
                answer.answer
            );

            if (!isValidPlacement(grid, placements, answerMap, answer, placement)) continue;

            candidates.push({...placement, answerId: answer.id});
        }
    }

    return candidates;
}