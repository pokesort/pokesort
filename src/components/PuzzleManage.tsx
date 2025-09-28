"use client"

import type { PuzzleGroup } from '@/src/assets/types/PuzzleApiResponse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notFound, redirect, useParams } from 'next/navigation';
import { FIELD_OPTIONS, MAX_SELECT, toTitleCase } from '@/src/scripts/utils';

import "@/src/styles/components/PuzzleManage.scss";
import { getGroupnameFromQuery } from './GroupName';
import { useLocale, useTranslations } from 'next-intl';
import ListBlock from './ListBlock';
import Loading from './Loading';
import EditIcon from '@/src/components/svg/EditIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import { useForm } from 'react-hook-form';
import Input from './forms/Input';
import GridIcon from './svg/GridIcon';

type Range = { min: number; max: number };

export default function PuzzleManage () {
    const t = useTranslations('');
    const locale = useLocale();

    const form = useForm();

    const [dictionary, setDictionary] = useState<Record<string, any>>();
    const [groups, setGroups] = useState<PuzzleGroup[]>([]);
    const [groupFormOpen, setGroupFormOpen] = useState(false);
    const [groupFormTab, setGroupFormTab] = useState(0);
    const [groupFormIndex, setGroupFormIndex] = useState(0);

    const rows = parseInt(form.watch("rows", 4));
    const cols = parseInt(form.watch("cols", 4));

    const rangeToRecord = useCallback((key: string, { min, max }: Range): Record<string, string> => {
        const record: Record<string, string> = {};
        if (['weak', 'strong'].includes(key)) key = 'types';

        for (let i = min; i <= max; i++) {
            if (key == 'categories' && i == 16) continue;

            if (['abilities', 'moves'].includes(key)) {
                if (dictionary && dictionary[key]) {
                    record[`${i}`] = `${toTitleCase(dictionary[key][i-1])}`;
                } else {
                    record[`${i}`] = `${i-1}`;
                }
            } else {
                record[`${i}`] = `${toTitleCase(t(`groupnames.${key}.${i}`))}`;
            }
        }
        return record;
    }, [dictionary, t]);

    useEffect(() => {
        const fetchDictionary = async () => {
            try {
                const headers = { 'Content-Type': 'application/json' };
                const [abilitiesResponse, movesResponse, pokemonResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/abilities/get`, { method: 'GET', headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/moves/get`, { method: 'GET', headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get`, { method: 'GET', headers }),
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
                    abilities: abilitiesData.abilities,
                    moves: movesData.moves,
                    pokemons: pokemonData.pokemons.reduce((acc: any, poke: any) => {
                        acc[poke.id] = poke;
                        return acc;
                    }, {})
                });
            } catch (e) {
                console.error(e);
            }
        };
        fetchDictionary();
    }, []); 

    const rowCounter = useMemo(() => {
        const array: number[] = [];
        for (let i=0; i<rows; i++) {
            array.push(i);
            if (!groups[i]) {
                groups.push({ query: '', pokemons: [], tips: [] });
            }
        }
        return array;
    }, [rows, groups]);

    const colCounter = useMemo(() => {
        return Array.from({ length: cols }, (_, i) => i);
    }, [cols]);

    const openGroupForm = useCallback((index: number, tab: number) => {
        setGroupFormOpen(true);
        setGroupFormIndex(index);
        setGroupFormTab(tab);
    }, []);

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
                                <Input type="select" label={t(`puzzle.challenge.label`)} name="challenge" defaultValue={'1'} options={{
                                    '1': t(`puzzle.challenge.1`),
                                    '2': t(`puzzle.challenge.2`),
                                    '3': t(`puzzle.challenge.3`),
                                    '4': t(`puzzle.challenge.4`)
                                }} form={form} />
                                <Input type="date" label="Data" name="date" form={form} />
                            </div>
                        </div>

                        {rowCounter.map((rowIndex) => {
                            const group = groups[rowIndex];
                            return (
                                <div className="group-card cut-in" key={rowIndex}>
                                    <p className="group-name edit-hover" onClick={() => openGroupForm(rowIndex, 0)}>
                                        {group.query ?
                                            getGroupnameFromQuery(group.query, dictionary, t, locale).join('  ·  ')
                                        :
                                            <>Novo Grupo</>
                                        }
                                        <EditIcon />
                                    </p>
                                    <ul className="group-mons">
                                        {colCounter.map((colIndex) => {
                                            if (!group.pokemons[colIndex])
                                                return (
                                                    <label className="block-container" key={colIndex}>
                                                        <div className="pokemon-block">
                                                            <input
                                                                type='radio'
                                                                name="pokemon"
                                                                value={0}
                                                                checked={false}
                                                                onChange={()=>{}}                                                            
                                                                onClick={()=> openGroupForm(rowIndex, 1)}
                                                                hidden
                                                            />
                                                            <p className="dummy-block">+</p>
                                                        </div>
                                                    </label>
                                                )
                                            else
                                                return (
                                                    <ListBlock
                                                        key={colIndex}
                                                        pokemon={dictionary.pokemons[group.pokemons[colIndex]]}
                                                        multiselect={false}
                                                        isSelected={false}
                                                        onSelect={()=> openGroupForm(rowIndex, 1)}
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
                                <GridIcon />                            
                                <p>Gerenciar Grupo</p>
                            </section>
                            <ul className="tabs-list">
                                <button className={`tab ${groupFormTab == 0 ? 'active' : ''}`} onClick={() => setGroupFormTab(0)}>Categoria</button>
                                <button className={`tab ${groupFormTab == 1 ? 'active' : ''}`} onClick={() => setGroupFormTab(1)}>Membros</button>
                            </ul>
                        </div>
                        <div className="group-form-content">
                            <div className={`tab-content ${groupFormTab == 0 ? 'active' : ''}`}>
                                <Input type="select" label="Tipo de Grupo" name={`groups.${groupFormIndex}.categoryType`} form={form} options={{
                                    'auto': 'Filtrado',
                                    'custom': 'Customizado'
                                }} />

                                {dictionary &&
                                    <div className={`filter-list ${form.watch(`groups.${groupFormIndex}.categoryType`) == 'auto' ? 'show' : ''}`}>
                                        {Object.keys(FIELD_OPTIONS).map((key: string) => {
                                            const records: Record<string, unknown> = FIELD_OPTIONS;
                                            let options: Record<string, string> = {};
                                            if (Array.isArray(records[key])) {
                                                options = Object.fromEntries(records[key].map((item: string) => [item, t(`groupnames.${key}.${item}`)]));
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

                                <div className={`filter-list one-col ${form.watch(`groups.${groupFormIndex}.categoryType`) == 'custom' ? 'show' : ''}`}>
                                    <Input type="text" label={`Nome do Grupo (Português)`} name={`groups.${groupFormIndex}.custom_groupname.pt`} form={form}/>
                                    <Input type="text" label={`Nome do Grupo (Inglês)`} name={`groups.${groupFormIndex}.custom_groupname.en`} form={form}/>
                                </div>
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
