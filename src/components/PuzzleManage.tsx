"use client"

import type { PuzzleData, PuzzleGroup } from '@/src/assets/types/PuzzleApiResponse';
import { useEffect, useMemo, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';

import "@/src/styles/components/PuzzleManage.scss";
import { getGroupnameFromQuery, getNaturalGroupnames } from './GroupName';
import { useLocale, useTranslations } from 'next-intl';
import ListBlock from './ListBlock';
import Loading from './Loading';
import Edit from './svg/Edit';

interface PuzzleManageProps {

}

export default function PuzzleManage ({}: PuzzleManageProps) {
    const t = useTranslations('');
    const locale = useLocale();

    const [rows, setRows] = useState<number>(4);
    const [cols, setCols] = useState<number>(6);

    const [groups, setGroups] = useState<PuzzleGroup[]>([]);
    const [dictionary, setDictionary] = useState<Record<string, string[]>>();
    
    useEffect(() => {
        setGroups(
            [
                {
                    query: '?region=paldea',
                    pokemons: [ 1010, 10253, 911, 10257 ],
                    tips: [ "text?region=paldea", "pair?1010,10253" ]
                },
            ]
        )
    }, [])

    useEffect(() => {
        const fetchDictionary = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [abilitiesResponse, movesResponse, pokemonResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/abilities/get`, {
                        method: 'GET', headers
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/moves/get`, {
                        method: 'GET', headers
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!abilitiesResponse.ok || !movesResponse.ok || !pokemonResponse.ok) {
                    throw new Error('Erro ao obter informações.');
                }
                const [abilitiesData, movesData, pokemonData] = await Promise.all([
                    abilitiesResponse.json(),
                    movesResponse.json(),
                    pokemonResponse.json()
                ]);

                setDictionary({
                    'abilities': abilitiesData.abilities,
                    'moves': movesData.moves,
                    'pokemons': pokemonData.pokemons.reduce((acc: any, poke: any) => {
                        acc[poke.id] = poke;
                        return acc;
                    }, {})
                });
            } catch (e) {
                console.error(e);
            } finally {                
                // setLoading(false);
            }
        };

        fetchDictionary();
    }, []); 
    
    const rowCounter = useMemo(() => {
        const array: number[] = [];

        for (let i=0; i<rows; i++) {
            array.push(i);
            if (!groups[i]) {
                groups.push({
                    query: '',
                    pokemons: [],
                    tips: []
                });
            }
        };

        return array;
    }, [rows, groups])

    const colCounter = useMemo(() => {
        const array: number[] = [];

        for (let i=0; i<cols; i++) {
            array.push(i);
        };

        return array;
    }, [cols])
    
    useEffect(() => {
      console.log(dictionary)
    }, [dictionary])
    

    return (
    <>
        {dictionary == undefined ?
            <Loading expand={false} />
            :
            <section id="group-list" className={`cut-in`}
                style={{'--rows': rows, '--cols': cols} as React.CSSProperties}>
                <div className="puzzle-header edit-hover">
                    <p>Novo Puzzle  ·  4x3  ·  Sem Data</p>
                    <Edit />
                </div>
                {rowCounter.map((index: number) => {
                    const group = groups[index];

                    return (
                        <div className="group-card cut-in" key={index}>
                            <p className="group-name edit-hover">
                                {group.query ?
                                    getGroupnameFromQuery(group.query, dictionary, t, locale).join('  ·  ')
                                :
                                    <>Novo Grupo</>
                                }
                                <Edit />
                            </p>
                            <ul className="group-mons">
                                {colCounter.map((index: number) => {
                                    if (!group.pokemons[index])
                                        return (
                                            <label className="block-container" key={index}>
                                                <div className="pokemon-block">
                                                    <input
                                                        type='radio'
                                                        name="pokemon"
                                                        value={0}
                                                        checked={false}
                                                        onChange={()=>{}}
                                                        hidden
                                                    />
                                                    <p className="dummy-block">+</p>
                                                </div>
                                            </label>
                                        )
                                    else
                                        return (
                                            <ListBlock
                                                key={index}
                                                pokemon={dictionary.pokemons[group.pokemons[index]]}
                                                multiselect={false}
                                                isSelected={false}
                                                onSelect={()=>{}}
                                                onPress={()=>{}}
                                            />
                                        )
                                })}
                            </ul>
                        </div>
                    )
                })}
            </section>
        }
    </>
    )
}