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

export function initializeCrossword(size) {

    const grid = utils.createEmptyGrid(size);
    const placements = [];

    return {
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

    const answerMap = new Map(selectedWords.map((word) => [word.id, word]));

    const anchorCandidates = utils.getAnchorCandidates(selectedWords, size);
    console.log(
        "Âncoras possíveis:",
        [...new Set(anchorCandidates.map((candidate) => candidate.anchor.answer))]
    );

    for (const candidate of anchorCandidates) {

        console.log(
            "Tentando âncora:",
            candidate.anchor.answer,
            candidate.placement
        );

        const { grid, placements } = initializeCrossword(size);

        utils.placeWord(grid, candidate.anchor, candidate.placement);
        placements.push(candidate.placement);

        const generationWords = [
            candidate.anchor,
            ...selectedWords.filter(
                (word) => word.id !== candidate.anchor.id
            )
        ];

        const success = generateCrossword(grid, placements, generationWords, answerMap, 1);

        if (success) {
            return {
                selectedWords,
                grid,
                placements
            };
        }

    }

    return null;
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