"use client"

import { useTranslations } from 'next-intl';
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocale } from 'next-intl';
import { formatDate, shuffleArray } from '@/src/scripts/utils';

import type { PuzzleData } from '@/src/assets/types/PuzzleApiResponse';
import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';
import CalendarIcon from '@/src/components/svg/CalendarIcon';
import GroupName from './GroupName';

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

interface SolvedGroupsGridProps {
    groups: string[];
    dictionary: any;
}

const SolvedGroupsGrid = ({groups, dictionary}: SolvedGroupsGridProps) => {
    return (
        <section className="solved-groups-grid">
            
            {groups.map((group: string, index: number)=> (
                <div key={group} className="solved-group">
                    <GroupName query={group} dictionary={dictionary}/>
                </div>
            ))}
        </section>
    )
}

type PuzzleGuess = {
    type: 0 | 1 | 2; // guess | hint | dex
    accuracy: number;
    pokemons: number[];
    group: number | null;
}

interface PuzzleGridProps {
    puzzle: PuzzleData;
    pause: boolean,
    setPause: (pause: boolean) => void;
    pokemons: any[];
    dictionary: any;
    setGuesses: React.Dispatch<React.SetStateAction<PuzzleGuess[]>>;
}

const PuzzleGrid = React.memo(({puzzle, pause, setPause, pokemons, dictionary, setGuesses}: PuzzleGridProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [incorrectGuessIds, setIncorrectGuessIds] = useState<Set<number>>(new Set());
    const [correctGuessIds, setCorrectGuessIds] = useState<Set<number>>(new Set());
    const [solvedGroupIds, setSolvedGroupIds] = useState<Set<number>>(new Set());
    const [solvedInOrder, setSolvedInOrder] = useState<any[]>([]);
    const [solvedGroupNames, setSolvedGroupNames] = useState<string[]>([]);

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

    const compareGroups = useCallback((selected: Set<number>): PuzzleGuess | null => {
        if (!puzzle || !puzzle.groups) return null;

        const selectedArr = Array.from(selected).sort();
        let guess = {
            type: 0,
            accuracy: 0,
            pokemons: selectedArr,
            group: null
        } as PuzzleGuess;

        for (let i = 0; i < puzzle.groups.length; i++) {
            if (solvedGroupIds.has(puzzle.groups[i].pokemons[0])) continue;

            const otherArr = [...puzzle.groups[i].pokemons].sort();
            if (selectedArr.length === otherArr.length && selectedArr.every((val, j) => val === otherArr[j])) {
                guess.accuracy = 100;
                guess.group = i;
                break;
            }
        }

        return guess;
    }, [puzzle, solvedGroupIds]);

    const handleGuess = useCallback((guess: PuzzleGuess) => {
        setGuesses((prev: PuzzleGuess[]) => [...prev, guess]);
    }, []);

    const markGroupAsSolved = useCallback((newlySolvedIds: Set<number>) => {
        const newSolvedGroup = pokemons.filter((p:any) => newlySolvedIds.has(p.id));

        setSolvedInOrder(prevOrder => [...prevOrder, ...newSolvedGroup]);
        setSolvedGroupIds(prevIds => new Set([...prevIds, ...newlySolvedIds]));
    }, [pokemons]);

    useEffect(() => {
        if (!puzzle?.cols || selectedIds.size < puzzle.cols) {
            return;
        }

        const makeGuess = () => {
            setPause(true);
            const guess = compareGroups(selectedIds);

            if (!guess) return;
            handleGuess(guess);
            
            if (guess.accuracy >= 100) {
                setCorrectGuessIds(selectedIds);
                setTimeout(() => {
                    markGroupAsSolved(selectedIds);
                    if (guess.group != null)
                        solvedGroupNames.push(puzzle.groups[guess.group].query);
                    setSelectedIds(new Set());
                    setPause(false);
                }, 800);
            } else {
                setIncorrectGuessIds(selectedIds);                
                setTimeout(() => {
                    setSelectedIds(new Set());
                    setIncorrectGuessIds(new Set());
                    setPause(false);
                }, 800);
            }
        };

        makeGuess();
    }, [selectedIds, puzzle, compareGroups, markGroupAsSolved, handleGuess]);

    const activePokemons = useMemo(() => pokemons.filter((p:any) => !solvedGroupIds.has(p.id)), [pokemons, solvedGroupIds]);

    return (
        <motion.section
            className={`puzzle disable-select cols-${puzzle.cols} ${pause ? 'pause' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <SolvedGroupsGrid groups={solvedGroupNames} dictionary={dictionary}/>
            <AnimatePresence>

                {solvedInOrder.map((p: any, index: number) => {
                    const isSelected = selectedIds.has(p.id);
                    const isCorrect = solvedGroupIds.has(p.id) || correctGuessIds.has(p.id);
                    const isIncorrect = incorrectGuessIds.has(p.id);

                    return (
                        <PokemonBlock
                            key={p.id}
                            pokemon={p}
                            multiselect={true}
                            isSelected={isSelected}
                            isSolved={true}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            onSelect={handleSelect}
                        />
                    )
                })}
                {activePokemons.map((p: any, index: number) => {
                    const isSelected = selectedIds.has(p.id);
                    const isCorrect = solvedGroupIds.has(p.id) || correctGuessIds.has(p.id);
                    const isIncorrect = incorrectGuessIds.has(p.id);

                    return (
                        <PokemonBlock
                            key={p.id}
                            pokemon={p}
                            multiselect={true}
                            isSelected={isSelected}
                            isSolved={false}
                            isCorrect={isCorrect}
                            isIncorrect={isIncorrect}
                            onSelect={handleSelect}
                        />
                    )
                })}
            </AnimatePresence>
        </motion.section>
    )
})

interface PuzzleProps {
    puzzle: PuzzleData | undefined;
    setPuzzle: (puzzle: PuzzleData) => void;
    dictionary: any;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
}

export default React.memo(function Puzzle({puzzle, setPuzzle, dictionary, loading, setLoading, error, setError}: PuzzleProps) {
    const t = useTranslations();
    const locale = useLocale();

    const [pause, setPause] = useState<boolean>(false);
    const [guesses, setGuesses] = useState<PuzzleGuess[]>([]);
    const [pokemons, setPokemons] = useState<any>([]);

    useEffect(() => {
        if (dictionary) setPokemons(shuffleArray(dictionary.pokemons));
    }, [dictionary]);    

    useEffect(() => {
        if (process.env.NODE_ENV === "development") {        
            console.log(guesses);
        }
    }, [guesses]);

    const date = useMemo(() => {
        return puzzle ? formatDate(puzzle.date, locale) : '';
    }, [puzzle]);

    return (
        <>
            <ul className="guesses-container">
                {guesses.map((guess: PuzzleGuess, index: number) => (
                    <li key={index} className={`guess-${guess.accuracy >= 100 ? '1' : '0'}`}></li>
                ))}
            </ul>
            <div style={{'--cols': puzzle ? puzzle.cols : 4, '--rows': puzzle ? puzzle.rows : 4} as React.CSSProperties} className="window-container">
                <section className="puzzle-info-row">
                    {date && !loading && <>
                        <CalendarIcon/>
                        <p>{date}</p>
                    </>}
                </section>
                {loading || !puzzle ? (
                    <p style={{margin: "auto 0", textAlign: "center"} as CSSProperties}>Loading</p>
                ): (
                    <PuzzleGrid
                        puzzle={puzzle}
                        pause={pause}
                        setPause={setPause}
                        pokemons={pokemons}
                        dictionary={dictionary}
                        setGuesses={setGuesses}
                    />
                )}
            </div>      
        </>
    )
})