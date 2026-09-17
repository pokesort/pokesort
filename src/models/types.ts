import { CHALLENGE_CATEGORIES } from "../scripts/utils";

export interface GuessCharacteristic {
    type: ChallengeFieldType;
    value: string;
}

export type GameDifficult = "easy" | "medium" | "hard";

export const DIFFICULTY_POKEMON_COUNT: Record<GameDifficult, number> = {
    easy: 24,
    medium: 32,
    hard: 40,
};

export interface Pokemon {
    _id: string;
    id: number;
    is_default: boolean;
    name: string;
    dex_number: number;
    species_name: string;
    types: string[];
    moves: string[];
    egg_groups: string[];
    evolution_step: string;
    categories: string[];
    generation: number;
    region: string;
    abilities: string[];
    other_forms: string[];
    habitat: string;
    shape: string;
    color: string;
    sprite_default: string;
    sprite_shiny: string;
    isActive: boolean;
}

export const CHALLENGE_FIELDS = {
    1: {
        types: { min: 1, max: 18 },
        region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
        generation: { min: 1, max: 9 },
        form: ['first', 'middle', 'final'],
        dual: { min: 1, max: 2 },
        categories: [...CHALLENGE_CATEGORIES[1]],
    },
    2: {
        color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
        others: { min: 1, max: 2 },
        step: ['no_line', 'has_split', 'is_split'],
        categories: [...CHALLENGE_CATEGORIES[2]],
    },
    3: {
        weak: { min: 1, max: 18 },
        strong: { min: 1, max: 18 },
        methods: { min: 2, max: 11 },
        habitat: ['cave', 'forest', 'grassland', 'mountain', 'rare', 'rough-terrain', 'sea', 'urban', 'waters-edge'],
        categories: [...CHALLENGE_CATEGORIES[3]],
    },
    4: {
        abilities: { min: 1, max: 307 },
        moves: { min: 1, max: 919 },
        shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
        egg_groups: ['monster', 'dragon', 'ground', 'water1', 'bug', 'flying', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
        categories: [...CHALLENGE_CATEGORIES[4]],
    },
} as const;

export type ChallengeFieldType =
    keyof typeof CHALLENGE_FIELDS[1]
    | keyof typeof CHALLENGE_FIELDS[2]
    | keyof typeof CHALLENGE_FIELDS[3]
    | keyof typeof CHALLENGE_FIELDS[4];

export function getCharacteristicPoints(characteristic: GuessCharacteristic): number {

    if (characteristic.type === "categories") {
        const category = Number(characteristic.value);

        for (const [points, categories] of Object.entries(CHALLENGE_CATEGORIES)) {
            if ((categories as readonly number[]).includes(category)) {
                return Number(points);
            }
        }

        return 0;
    }

    for (const [points, fields] of Object.entries(CHALLENGE_FIELDS)) {
        
        if (characteristic.type in fields) return Number(points);
    }

    return 0;
}

export function getAllCharacteristicTypes(): ChallengeFieldType[] {
    const types: ChallengeFieldType[] = [];

    for (const fields of Object.values(CHALLENGE_FIELDS)) {
        for (const type of Object.keys(fields) as ChallengeFieldType[]) {
            if (!types.includes(type)) {
                types.push(type);
            }
        }
    }

    return types;
}

export function getCharacteristicOptions(type: ChallengeFieldType) {
    if (type === "categories") {
        return Object.values(CHALLENGE_CATEGORIES).flat();
    }

    for (const fields of Object.values(CHALLENGE_FIELDS)) {

        const value = (fields as Record<string, unknown>)[type];

        if (value !== undefined) return value;
    }

    return undefined;
}