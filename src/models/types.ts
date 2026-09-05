export interface GuessCharacteristic {
  type: CharacteristicType;
  value: string;
}

export const CHARACTERISTIC_DEFINITIONS = {
    types: { points: 1 },
    dual: { points: 1 },
    region: { points: 1 },
    others: { points: 1 },
    generation: { points: 2 },
    methods: { points: 2 },
    color: { points: 2 },
    step: { points: 2 },
    form: { points: 2 },
    abilities: { points: 3 },
    moves: { points: 3 },
    shape: { points: 3 },
    weak: { points: 3 },
    strong: { points: 3 },
    egg_groups: { points: 3 },
} as const;

export type CharacteristicType =
    keyof typeof CHARACTERISTIC_DEFINITIONS;

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
