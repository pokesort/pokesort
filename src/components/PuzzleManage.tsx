"use client"

import type { PuzzleData, PuzzleGroup } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';
import { FIELD_OPTIONS, MAX_SELECT, toTitleCase } from '@/src/scripts/utils';

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

type Range = {
  min: number;
  max: number;
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
    const [groupFormTab, setGroupFormTab] = useState<number>(0);
    const [groupFormIndex, setGroupFormIndex] = useState<number>(0);
    
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
        console.log(formWatch);
    }, [formWatch])

    const rangeToRecord = useCallback((key: string, { min, max }: Range): Record<string, string> => {
        const record: Record<string, string> = {};

        if (['weak', 'strong'].includes(key)) {
            key = 'types';
        }

        for (let i = min; i <= max; i++) {
            if (key == 'categories' && i == 16)
            continue;

            if (['abilities', 'moves'].includes(key)) {
            if (dictionary && dictionary[key]) {
                record[`${i}`] = `${toTitleCase(dictionary[key][i-1])}`;
            } else {
                record[`${i}`] = `${i-1}`;  
            }
            } else {
            record[`${i}`] = `${t(`groupnames.${key}.${i}`)}`;
            }
        }
        return record;
    }, [dictionary]);

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
        setGroupFormIndex(index);
        setGroupFormTab(tab);
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
                        <p className="group-name edit-hover">
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
                <section id="group-form" className={`${groupFormOpen ? 'group-open' : ''}`}>
                    <div className="window-container">
                        <section className="window-info-row">
                            <p>Gerenciar Grupo</p>
                        </section>
                        <ul className="tabs-list">
                            <button className={`tab ${groupFormTab == 0 ? 'active' : ''}`} onClick={() => setGroupFormTab(0)}>
                                Categoria
                            </button>
                            <button className={`tab ${groupFormTab == 1 ? 'active' : ''}`} onClick={() => setGroupFormTab(1)}>
                                Membros
                            </button>
                        </ul>
                    </div>
                    <div className="group-form-content">
                        <div className={`tab-content ${groupFormTab == 0 ? 'active' : ''}`}>
                            <Input type="select" label="Tipo de Grupo" name={`groups.${groupFormIndex}.categoryType`} form={form} options={{
                                'auto': 'Filtrado',
                                'custom': 'Customizado'
                            }} />
                            {dictionary != undefined &&
                                <div className="filter-list">
                                    {Object.keys(FIELD_OPTIONS).map((key: string, index: number) => {
                                        const records: Record<string, unknown> = FIELD_OPTIONS;
                            
                                        let options: Record<string, string> = {};
                                        if (Array.isArray(records[key])) {
                                            options = Object.fromEntries(records[key].map((item: string) => [item, t(`groupnames.${key}.${item}`)])) as Record<string, string>;
                                        } else {
                                            options = rangeToRecord(key, records[key] as Range);
                                        }
                            
                                        return (
                                            <Input key={key} type="multiselect"
                                            max={MAX_SELECT[key as keyof typeof MAX_SELECT]}
                                            label={t(`groupnames.${key}.short`)}
                                            name={`groups.${groupFormIndex}.${key}`} form={form} options={options}
                                            />
                                        )
                                    })}
                                </div>
                            }
                        </div>
                        <div className={`tab-content ${groupFormTab == 1 ? 'active' : ''}`}>
                            Tab 2 !!
                        </div>
                    </div>
                </section>
            </>
        }
    </>
    )
}