interface PendingGuess {
    playerId: string;
    pokemonIds: number[];
    points: number;
    order: number;
}

const CONCURRENCY_WINDOW_MS = 100;

function hasPokemonOverlap(
    firstPokemonIds: number[],
    secondPokemonIds: number[]
): boolean {
    return firstPokemonIds.some((id) =>
        secondPokemonIds.includes(id)
    );
}

function removePendingGuess(
    pendingGuesses: PendingGuess[],
    pendingGuess: PendingGuess
): PendingGuess[] {
    return pendingGuesses.filter(
        (guess) => guess !== pendingGuess
    );
}

function arbitrateGuess(
    pendingGuesses: PendingGuess[],
    pendingGuess: PendingGuess
): boolean {
    const opponentGuess = pendingGuesses.find(
        (guess) =>
            guess.playerId !== pendingGuess.playerId
    );

    if (!opponentGuess) {
        return true;
    }

    const hasOverlap = hasPokemonOverlap(
        pendingGuess.pokemonIds,
        opponentGuess.pokemonIds
    );

    if (!hasOverlap) {
        return true;
    }

    const guessToRemove = tiebreaker(pendingGuess, opponentGuess);

    const updatedPendingGuesses = removePendingGuess(
        pendingGuesses,
        guessToRemove
    );

    pendingGuesses.splice(
        0,
        pendingGuesses.length,
        ...updatedPendingGuesses
    );

    return guessToRemove !== pendingGuess;
}

function tiebreaker(pendingGuess: PendingGuess, opponentGuess: PendingGuess): PendingGuess {

    if (pendingGuess.points > opponentGuess.points) return opponentGuess;

    if (pendingGuess.points < opponentGuess.points) return pendingGuess;

    // Se os pontos forem iguais, desempate pela ordem de chegada, retorna o perdedor (quem chegou por ultimo)
    return pendingGuess.order > opponentGuess.order ? pendingGuess : opponentGuess;
}

function test(
    name: string,
    expected: boolean,
    actual: boolean
): void {
    console.log(
        actual === expected
            ? `PASS: ${name}`
            : `FAIL: ${name} | esperado=${expected}, obtido=${actual}`
    );
}

function createGuess(
    playerId: string,
    pokemonIds: number[],
    points: number,
    order: number
): PendingGuess {
    return {
        playerId,
        pokemonIds,
        points,
        order
    };
}

// 1. Overlap: jogador atual tem mais pontos
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 5, 1);
    const player2 = createGuess("P2", [3, 4, 5, 6], 3, 2);

    const pending = [player1, player2];

    const result = arbitrateGuess(pending, player1);

    test(
        "Overlap - maior pontuação vence",
        true,
        result
    );
}

// 2. Overlap: jogador atual tem menos pontos
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 3, 1);
    const player2 = createGuess("P2", [3, 4, 5, 6], 5, 2);

    const pending = [player1, player2];

    const result = arbitrateGuess(pending, player1);

    test(
        "Overlap - menor pontuação perde",
        false,
        result
    );
}

// 3. Sem overlap
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 3, 1);
    const player2 = createGuess("P2", [5, 6, 7, 8], 5, 2);

    const pending = [player1, player2];

    const result = arbitrateGuess(pending, player1);

    test(
        "Sem overlap - palpite continua válido",
        true,
        result
    );
}

// 4.1. Empate com p1 chegando primeiro
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 5, 100);
    const player2 = createGuess("P2", [3, 4, 5, 6], 5, 101);

    const pending = [player1, player2];

    const result = arbitrateGuess(pending, player1);

    test(
        "Overlap com empate - P1 chegou primeiro e vence",
        true,
        result
    );
}

// 4.2. Empate com p2 chegando primeiro
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 5, 100);
    const player2 = createGuess("P2", [3, 4, 5, 6], 5, 99);

    const pending = [player1, player2];

    const result = arbitrateGuess(pending, player1);

    test(
        "Overlap com empate - P2 chegou primeiro e vence",
        false,
        result
    );
}

// 5. Palpite sozinho
{
    const player1 = createGuess("P1", [1, 2, 3, 4], 5, 1);

    const pending = [player1];

    const result = arbitrateGuess(pending, player1);

    test(
        "Palpite sem adversário",
        true,
        result
    );
}