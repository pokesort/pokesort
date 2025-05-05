"use client"

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';


export default function Daily() {
    const t = useTranslations();

    const rows = 4;
    const cols = 4;

    const [puzzle, setPuzzle] = useState<any>([]);
    const [pokemons, setPokemons] = useState<any>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pause, setPause] = useState<boolean>(false);
    const [guesses, setGuesses] = useState<number[]>([]);

    function handleSelect (id: number) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function handleGuess (guess: number) {''
        setGuesses(prev => [...prev, guess]);
    }

    const moveToTop = (selectedIds: number[]) => {
        setPokemons((prev: any[]) => {
            const top = prev.filter((pokemon) => selectedIds.includes(pokemon.id));
            const rest = prev.filter((pokemon) => !selectedIds.includes(pokemon.id));
            return [...top, ...rest];
        });
    };

    function compareGroups (selected: number[]) {
        let equal = false;
        selected.sort();

        puzzle.groups.forEach((group: any) => {
            const other = [...group.pokemons];
            
            if (!equal)
                equal = equal || selected.every((val, i) => val == other[i]);
        })

        return equal;
    }

    useEffect(() => {
        function getPuzzle () {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/daily`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then((res) => res.json())
                .then((result) => {
                    result.data.groups.forEach((group: any) => {
                        group.pokemons.sort();
                    })
                    setPuzzle(result.data)
                    setPokemons(shuffleMons(result.pokemon));
                })
        }

        function shuffleMons (pokemon: any[]) {
            return pokemon.sort(() => Math.random() - 0.5);
        }

        getPuzzle();        
    }, [])

    useEffect(() => {
        function makeGuess() {
            const selected = document.querySelectorAll('label:has(input:checked)');
            const correct = compareGroups(selectedIds);
            let className = correct ? 'correct' : 'incorrect';

            setPause(true);
            setTimeout(() => {
                selected.forEach(s => {
                    s.classList.add(className);
                })
            }, 200);
            setTimeout(() => {
                setSelectedIds([]);
                handleGuess(correct ? 1 : 0);
                if (correct) {
                    selected.forEach(s => {
                        s.querySelector('.pokemon-block')?.classList.add('permaselect');
                    })
                    moveToTop(selectedIds)
                } else {
                    selected.forEach(s => {
                        s.classList.remove(className);
                    })
                };
                setPause(false);
            }, 900);            
        }

        if (selectedIds.length >= cols) {
            makeGuess();
        }
    }, [selectedIds])    

    return (
        <>
            <section className="puzzle-info-row">
                <div/>
                <ul className="guesses-container">
                    {guesses.map((guess: number, index: number) => (
                        <li key={index} className={`guess-${guess}`}></li>
                    ))}
                </ul>
            </section>
            <section className={`puzzle disable-select ${pause ? 'pause' : ''}`}>
                {pokemons.map((p: any, index: number) => (
                    <PokemonBlock
                        key={p.id}
                        pokemon={p}
                        multiselect={true}
                        isSelected={selectedIds.includes(p.id)}
                        onSelect={() => handleSelect(p.id)}
                    />
                ))}
            </section>
        </>
    )
}