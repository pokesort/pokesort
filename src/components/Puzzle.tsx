"use client"

import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { PuzzleApiResponseUnion } from '@/src/assets/types/PuzzleApiResponse';
import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';
import CalendarIcon from '@/src/components/svg/CalendarIcon';

interface PuzzleProps {
    puzzleId: string;
}

function formatDate(inputDate: string): string {
    const date = new Date(`${inputDate}T00:00:00`);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function shuffleMons<T>(pokemonArray: T[]): T[] {    
    return [...pokemonArray].sort(() => Math.random() - 0.5);
}

export default React.memo(function Puzzle({puzzleId}: PuzzleProps) {
    const t = useTranslations();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [puzzle, setPuzzle] = useState<any>([]);

    const [pokemons, setPokemons] = useState<any>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [pause, setPause] = useState<boolean>(false);
    const [guesses, setGuesses] = useState<any[]>([]);

    const [incorrectGuessIds, setIncorrectGuessIds] = useState<Set<number>>(new Set());
    const [solvedGroupIds, setSolvedGroupIds] = useState<Set<number>>(new Set());

    const handleSelect = useCallback((id: number) => {
        if (pause) return;

        setSelectedIds(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, [pause]);

    const compareGroups = useCallback((selected: Set<number>): boolean => {
        if (!puzzle || !puzzle.groups) return false;

        const selectedArr = Array.from(selected).sort();

        for (const group of puzzle.groups) {
            if (solvedGroupIds.has(group.pokemons[0])) continue;

            const otherArr = [...group.pokemons].sort();
            if (selectedArr.length === otherArr.length && selectedArr.every((val, i) => val === otherArr[i])) {
                return true;
            }
        }
        return false;
    }, [puzzle, solvedGroupIds]);

    function handleGuess (guess: number) {''
        setGuesses(prev => [...prev, guess]);
    }

    const moveToTop = useCallback((newlySolvedIds: number[]) => {
        setPokemons((prevPokemons: any) => {
            const top = prevPokemons.filter((p: any) => newlySolvedIds.includes(p.id));
            const rest = prevPokemons.filter((p: any) => !newlySolvedIds.includes(p.id));
            return [...top, ...rest];
        });
    }, []);

    // FETCH INICIAL
    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (['get', '', null].includes(puzzleId)) {
                    throw new Error('Não conseguimos encontrar este puzzle...');
                }
                const [puzzleResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/${puzzleId}`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!puzzleResponse.ok) {
                    throw new Error('Ops! Ocorreu um erro inesperado.');
                }
                const [puzzleData] = await Promise.all([
                    puzzleResponse.json(),
                ]);

                setPuzzle(puzzleData.data);
                setPokemons(shuffleMons(puzzleData.pokemon));
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {
                setTimeout(() => {                    
                    setLoading(false);
                }, 300);
            }
        };

        fetchPageData();
    }, [puzzleId])

    useEffect(() => {
        if (!puzzle || selectedIds.size < puzzle.cols) {
            return;
        }

        const makeGuess = () => {
            setPause(true);
            const isCorrect = compareGroups(selectedIds);
            
            if (isCorrect) {
                setSolvedGroupIds(selectedIds);
                setGuesses(prev => [...prev, 1]);

                setTimeout(() => {
                    moveToTop(Array.from(selectedIds));
                    setSelectedIds(new Set());
                    setPause(false);
                }, 800);                
            } else {
                setIncorrectGuessIds(selectedIds);
                setGuesses(prev => [...prev, 0]);
                
                setTimeout(() => {
                    setSelectedIds(new Set());
                    setIncorrectGuessIds(new Set());
                    setPause(false);
                }, 800);
            }
        };

        makeGuess();
    }, [selectedIds, puzzle, compareGroups, moveToTop]);

    const date = useMemo(() => {
        return puzzle ? formatDate(puzzle.date) : '';
    }, [puzzle]);

    return (
        <>
            <ul className="guesses-container">
                {guesses.map((guess: number, index: number) => (
                    <li key={index} className={`guess-${guess}`}></li>
                ))}
            </ul>            
            <div style={{'--cols': puzzle.cols} as React.CSSProperties} className="window-container">
                <section className="puzzle-info-row">
                    {date && !loading && <>
                        <CalendarIcon/>
                        <p>{date}</p>
                    </>}
                </section>
                {loading ? (
                    <p>Loading</p>
                ): (
                    <section className={`puzzle disable-select ${pause ? 'pause' : ''}`}>
                        {pokemons.map((p: any, index: number) => {
                            const isSelected = selectedIds.has(p.id);
                            const isSolved = solvedGroupIds.has(p.id);
                            const isIncorrect = incorrectGuessIds.has(p.id);

                            return (
                                <PokemonBlock
                                    key={p.id}
                                    pokemon={p}
                                    multiselect={true}
                                    isSelected={isSelected}
                                    isSolved={isSolved}
                                    isIncorrect={isIncorrect}
                                    onSelect={handleSelect}
                                />
                            )
                        })}
                    </section>
                )}
            </div>      
        </>
    )
})