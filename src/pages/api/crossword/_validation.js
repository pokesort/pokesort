import { getPlacementsAtCell } from "./_utils";

export function isValidPlacement(grid, placements, answerMap, answer, placement) {

    if (!isWithinBounds(grid, answer, placement)) return false;

    if (!hasValidCollisions(grid, placements, answerMap, answer, placement)) return false;

    if (hasInvalidNeighbors(grid, placements, answerMap, answer, placement)) return false;

    return true;
}

export function isWithinBounds(grid, answer, placement) {
    const size = grid.length;
    const length = answer.answer.length;

    if (placement.row < 0 || placement.col < 0) {
        return false;
    }

    if (placement.direction === "horizontal") {
        return (
            placement.row < size &&
            placement.col + length <= size
        );
    }

    return (
        placement.col < size &&
        placement.row + length <= size
    );
}

export function hasValidCollisions(grid, placements, answerMap, answer, placement) {

    for (let i = 0; i < answer.answer.length; i++) {

        const row =
            placement.direction === "horizontal"
                ? placement.row
                : placement.row + i;

        const col =
            placement.direction === "horizontal"
                ? placement.col + i
                : placement.col;

        const cell = grid[row][col];

        if (cell.type === "blocked") continue;

        if (cell.letter !== answer.answer[i]) return false;

        const existingPlacements = getPlacementsAtCell(placements, answerMap, row, col);

        const hasSameDirection = existingPlacements.some(
            (existing) =>
                existing.direction === placement.direction
        );

        if (hasSameDirection) return false;
    }

    return true;
}

export function hasInvalidNeighbors(grid, placements, answerMap, answer, placement) {

    const { direction, row, col } = placement;

    const length = answer.answer.length;

    for (let i = 0; i < length; i++) {
        const currentRow = direction === "horizontal"
            ? row
            : row + i;

        const currentCol = direction === "horizontal"
            ? col + i
            : col;

        const neighbors = direction === "horizontal"
            ? [
                [currentRow - 1, currentCol],
                [currentRow + 1, currentCol]
            ]
            : [
                [currentRow, currentCol - 1],
                [currentRow, currentCol + 1]
            ];

        for (const [neighborRow, neighborCol] of neighbors) {
            if (
                neighborRow < 0 ||
                neighborRow >= grid.length ||
                neighborCol < 0 ||
                neighborCol >= grid.length
            ) {
                continue;
            }

            const neighbor = grid[neighborRow][neighborCol];

            if (neighbor.type !== "letter") continue;

            const neighborPlacements = getPlacementsAtCell(placements, answerMap, neighborRow, neighborCol);

            const isPartOfPerpendicularWord = neighborPlacements.some(
                    (existing) => existing.direction !== placement.direction
                );

            if (!isPartOfPerpendicularWord) return true;
        }
    }

    const { beforeLetter, afterLetter } = checkBeforeAndAfter(grid, length, direction, row, col);

    if (beforeLetter) return true;

    if (afterLetter) return true;

    return false;
}

function checkBeforeAndAfter(grid, length, direction, row, col) {

    let beforeLetter = false;
    let afterLetter = false;

    const beforeRow = direction === "horizontal"
        ? row
        : row - 1;

    const beforeCol = direction === "horizontal"
        ? col - 1
        : col;

    const afterRow = direction === "horizontal"
        ? row
        : row + length;

    const afterCol = direction === "horizontal"
        ? col + length
        : col;

    if (beforeRow >= 0 &&
        beforeRow < grid.length &&
        beforeCol >= 0 &&
        beforeCol < grid.length &&
        grid[beforeRow][beforeCol].type === "letter") {
        beforeLetter = true;
    }

    if (afterRow >= 0 &&
        afterRow < grid.length &&
        afterCol >= 0 &&
        afterCol < grid.length &&
        grid[afterRow][afterCol].type === "letter") {
        afterLetter = true;
    }

    return { beforeLetter, afterLetter };
}