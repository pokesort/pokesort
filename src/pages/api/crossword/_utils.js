import { filterPokemons } from "../../../scripts/server_utils";
import { ANSWERS_BY_SIZE } from "../../../assets/types/CrosswordTypes";

export async function getCrosswordPokemons(query, amount) {

    const pokemons = await filterPokemons(query, amount);

    return pokemons.map((pokemon) => ({
        id: pokemon.id,
        speciesName: pokemon.species_name
    }));
}

export function sanitizeSpeciesName(speciesName) {
    return speciesName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase();
}

export function getWordsForGrid(words, size) {
    const amount = ANSWERS_BY_SIZE[size];

    return words.slice(-amount);
}

export function createEmptyGrid(size) {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({
            type: "blocked"
        }))
    );
}

export function createAnchorPlacement(answer, size) {
    const row = Math.floor(size / 2);
    const col = Math.floor((size - answer.answer.length) / 2);

    return {
        answerId: answer.id,
        direction: "horizontal",
        row,
        col
    };
}

export function getAnchorCandidates(words, size) {
    const candidates = [];

    const anchorLength = words[0].answer.length;
    const anchorWords = words.filter(
        (word) => word.answer.length === anchorLength
    );

    const center = Math.floor(size / 2);
    const offsets = [0, -1, 1, -2, 2, -3, 3];

    for (const anchor of anchorWords) {

        for (const offset of offsets) {
            const row = center + offset;
            const col = center - Math.floor(anchorLength / 2);
    
            if (col >= 0 && col + anchorLength <= size && row >= 0 && row < size) {

                candidates.push({
                    anchor,
                    placement: {
                        direction: "horizontal",
                        row,
                        col,
                        answerId: anchor.id
                    }
                });
            }
        }
    
        for (const offset of offsets) {
            const row = center - Math.floor(anchorLength / 2);
            const col = center + offset;
    
            if (row >= 0 && row + anchorLength <= size && col >= 0 && col < size) {
                candidates.push({
                    anchor,
                    placement: {
                        direction: "vertical",
                        row,
                        col,
                        answerId: anchor.id
                    }
                });
            }
        }
    }

    return candidates;
}

export function placeWord(grid, answer, placement) {

    const changedCells = [];

    for (let i = 0; i < answer.answer.length; i++) {

        const row = placement.direction === "horizontal"
            ? placement.row
            : placement.row + i;

        const col = placement.direction === "horizontal"
            ? placement.col + i
            : placement.col;

        const cell = grid[row][col];

        if (cell.type === "blocked") {
            changedCells.push({row, col});

            grid[row][col] = {
                type: "letter",
                letter: answer.answer[i]
            };
        }
    }

    return changedCells;
}

export function removeWord(grid, changedCells) {
    for (const { row, col } of changedCells) {
        grid[row][col] = {
            type: "blocked"
        };
    }
}

export function findIntersections(grid, word) {

    const intersections = [];

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            const cell = grid[row][col];

            if (cell.type !== "letter") continue;

            for (let candidateIndex = 0; candidateIndex < word.length; candidateIndex++) {
                if (word[candidateIndex] !== cell.letter) continue;

                intersections.push({
                    candidateIndex,
                    row,
                    col
                });
            }
        }
    }

    return intersections;
}

export function getPlacementsAtCell(placements, answerMap, row, col) {

    return placements.filter((placement) => {
        const answer = answerMap.get(placement.answerId);

        if (!answer) return false;

        const length = answer.answer.length;

        if (placement.direction === "horizontal") {
            return (
                row === placement.row &&
                col >= placement.col &&
                col < placement.col + length
            );
        }

        return (
            col === placement.col &&
            row >= placement.row &&
            row < placement.row + length
        );
    });
}

export function createIntersectionPlacement(intersection, existingPlacement, word) {

    const direction =
        existingPlacement.direction === "horizontal"
            ? "vertical"
            : "horizontal";

    const row =
        direction === "horizontal"
            ? intersection.row
            : intersection.row - intersection.candidateIndex;

    const col =
        direction === "horizontal"
            ? intersection.col - intersection.candidateIndex
            : intersection.col;

    return {
        direction,
        row,
        col
    };
}