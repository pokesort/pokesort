//Types
export type CrosswordDirection = "horizontal" | "vertical";

export type CrosswordCellType = "blocked" | "letter";

export type CrosswordClueField =
    | "types"
    | "color"
    | "region"
    | "shape"
    | "egg_groups"
    | "categories"
    | "others"
    | "methods"
    | "moves"
    | "generation"
    | "habitat"
    | "abilities"
    | "step"
    | "weak"
    | "strong"
    | "form"
    | "dual";

export type CrosswordClueData = {
    field: CrosswordClueField;
    value: string | number | string[];
};

export type CrosswordClue = {
    data: CrosswordClueData[];
};

type CrosswordAnswer = {
    id: number;
    pokemonId: string;
    answer: string;
    clue: CrosswordClue;
};

export type CrosswordCell = {
    type: CrosswordCellType;
    letter?: string;
};

export type CrosswordGrid = {
    rows: number;
    columns: number;
    cells: CrosswordCell[][];
};

export type CrosswordPuzzle = {
    id: string;
    answers: CrosswordAnswer[];
    grid: CrosswordGrid;
};

//Consts
export const ANSWERS_BY_SIZE = {
    7: 4,
    8: 5,
    9: 6,
    10: 7,
    11: 8,
    12: 9
};