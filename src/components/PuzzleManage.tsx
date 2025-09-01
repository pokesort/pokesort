"use client"

import type { PuzzleData, PuzzleGroup } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';

import "@/src/styles/components/PuzzleManage.scss";
import { getGroupnameFromQuery, getNaturalGroupnames } from './GroupName';
import { useLocale, useTranslations } from 'next-intl';
import ListBlock from './ListBlock';
import Loading from './Loading';
import EditIcon from '@/src/components/svg/EditIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import { useForm } from 'react-hook-form';
import Input from './forms/Input';

interface PuzzleManageProps {

}

export default function PuzzleManage ({}: PuzzleManageProps) {
    const t = useTranslations('');
    const locale = useLocale();

    const form = useForm();
    const formWatch = form.watch();

    const [dictionary, setDictionary] = useState<Record<string, string[]>>();
    const [groups, setGroups] = useState<PuzzleGroup[]>([]);
    const [rows, setRows] = useState<number>(4);
    const [cols, setCols] = useState<number>(4);
    const [groupFormOpen, setGroupFormOpen] = useState<boolean>(false);
    
    useEffect(() => {
        setGroups(
            [
                {
                    query: '?region=paldea',
                    pokemons: [ 1010, 10253, 911, 10257, 25, 26 ],
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

    useEffect(() => {
        setRows(parseInt(formWatch['rows']));
        setCols(parseInt(formWatch['cols']));
    }, [formWatch])
    
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
    }, [rows, groups]);

    const colCounter = useMemo(() => {
        const array: number[] = [];

        for (let i=0; i<cols; i++) {
            array.push(i);
        };

        return array;
    }, [cols]);

    const openGroupForm = useCallback((index: number, tab: number) => {
        setGroupFormOpen(true);
    }, [groups]);
    
    useEffect(() => {
      console.log(dictionary)
    }, [dictionary])
    

    return (
    <>
        {dictionary == undefined ?
            <Loading expand={false} />
            :
            <>
                <div id="click-catcher" onClick={() => setGroupFormOpen(false)}></div>
                <section id="group-list" className={`cut-in ${groupFormOpen ? 'group-open' : ''}`}
                    style={{'--rows': rows, '--cols': cols} as React.CSSProperties}>
                    <div className="puzzle-header">
                        <p className="edit-hover">
                            Novo Puzzle
                            <TickIcon />
                        </p>
                        <div className="form-flex">
                            <Input type="select" label="Linhas" name="rows" defaultValue={'4'} options={{'4': '4', '5': '5'}} form={form} />
                            <Input type="select" label="Colunas" name="cols" defaultValue={'4'} options={{'4': '4', '5': '5', '6': '6'}} form={form} />
                            <Input type="date" label="Data" name="date" form={form} />
                        </div>
                    </div>
                    {rowCounter.map((index: number) => {
                        const group = groups[index];

                        return (
                            <div className="group-card cut-in" key={index}>
                                <p className="group-name edit-hover" onClick={() => openGroupForm(index, 0)}>
                                    {group.query ?
                                        getGroupnameFromQuery(group.query, dictionary, t, locale).join('  ·  ')
                                    :
                                        <>Novo Grupo</>
                                    }
                                    <EditIcon />
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
                                                            onClick={()=> openGroupForm(index, 1)}
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
                                                    onSelect={()=> openGroupForm(index, 1)}
                                                    onPress={()=>{}}
                                                />
                                            )
                                    })}
                                </ul>
                            </div>
                        )
                    })}
                </section>
                <section id="group-form" className={`window-container ${groupFormOpen ? 'group-open' : ''}`}>
                    <section className="window-info-row">
                        <p>Gerenciar Grupo</p>
                    </section>
                </section>
            </>
        }
    </>
    )
}