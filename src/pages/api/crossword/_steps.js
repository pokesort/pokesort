import * as utils from "./_utils";
import { isValidPlacement } from "./_validation";

export async function getWords(query, amount) {

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

            candidates.push({ ...placement, answerId: answer.id });
        }
    }

    return candidates;
}

export function generateCrossword(grid, placements, words, answerMap, index) {

    console.log("generateCrossword:", index,
        index < words.length ? words[index].answer : "DONE"
    );

    if (index >= words.length) return true;

    const answer = words[index];

    const candidates = findCandidatePlacements(grid, placements, answerMap, answer);

    console.log(
        "Tentando:",
        answer.answer,
        "candidatos:",
        candidates.length
    );

    for (const candidate of candidates) {

        const changedCells = utils.placeWord(grid, answer, candidate);

        placements.push(candidate);

        if (generateCrossword(grid, placements, words, answerMap, index + 1)) return true;

        console.log("Backtracking:", answer.answer, candidate);

        placements.pop();

        utils.removeWord(grid, changedCells);
    }

    console.log(
        "Sem solução para:",
        answer.answer
    );

    return false;
}

export function tryGenerateCrossword(words, size) {

    const selectedWords = utils.getWordsForGrid(words, size);

    if (selectedWords.length === 0) return null;

    const { grid, placements} = initializeCrossword(selectedWords, size);

    const answerMap = new Map(selectedWords.map((word) => [word.id, word]));

    const success = generateCrossword(grid, placements, selectedWords, answerMap, 1);

    if (!success) return null;

    return {
        selectedWords,
        grid,
        placements
    };
}

export function generateCrosswordBySize(words, minSize, maxSize) {

    for (let size = minSize; size <= maxSize; size++) {

        console.log(`Trying crossword ${size}x${size}`);
        const result = tryGenerateCrossword(words, size);

        if (result) {
            console.log(`Generated crossword ${size}x${size}`);
            return {
                ...result,
                size
            };
        }
        console.log(`Failed crossword ${size}x${size}`);
    }

    return null;
}