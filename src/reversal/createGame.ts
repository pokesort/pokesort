import { Pokemon } from "../models/types";
import { GameState } from "./types";

export function createGame(playerIds: string[], pokemons: Pokemon[]): GameState {
    return {
        board: pokemons.slice(0, 16),
        reserve: pokemons.slice(16),
        players: [
            {
                id: playerIds[0],
                name: "Jogador 1",
                score: 0,
            },
            {
                id: playerIds[1],
                name: "Jogador 2",
                score: 0,
            },
        ],
        status: "playing",
        result: null,
    };
}