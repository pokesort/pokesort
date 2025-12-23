/**
 * Represents a single Pokémon's identifying information.
 */
export interface Pokemon {
  id: number;
  name: string;
  dex_number: number;
  sprite_regular?: string;
  sprite_shiny?: string;
  cry?: string;
  species_name: string;
}

/**
 * Represents a group of related Pokémon within the puzzle grid.
 */
export interface PuzzleGroup {
  _id?: string;
  query: string;
  pokemons: number[];
  tips: string[];
}

/**
 * Represents the core data for a specific day's puzzle.
 */
export interface PuzzleData {
  _id?: string;
  author: string;
  from: string;
  daily?: boolean;
  date: string;
  rows: number;
  cols: number;
  groups: PuzzleGroup[];
  challenge: string;
  __v?: number;
}

/**
 * Represents the entire successful API response structure for the daily puzzle.
 */
export interface PuzzleApiResponse {
  success: boolean;
  data: PuzzleData;
  pokemon: Pokemon[];
}

/**
 * Represents a potential error response from the API.
 * You can expand this based on what your API returns on failure.
 */
export interface PuzzleApiErrorResponse {
    success: false;
    message: string;
}

/**
 * A union type that can represent either a successful response
 * or a potential error response.
 */
export type PuzzleApiResponseUnion = PuzzleApiResponse | PuzzleApiErrorResponse;