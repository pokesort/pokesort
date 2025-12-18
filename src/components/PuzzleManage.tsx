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
import { useForm, useWatch } from 'react-hook-form';
import Input from './forms/Input';
import GridIcon from './svg/GridIcon';
import SearchIcon from './svg/SearchIcon';
import Modal from './Modal';

type Range = { min: number; max: number };

interface PuzzleManageProps {
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>
}

export default function PuzzleManage ({error, setError}: PuzzleManageProps) {
    const t = useTranslations('');
    const locale = useLocale();

    const form = useForm();
    const formWatch = form.watch();

    const [loading, setLoading] = useState<boolean>(false);
    const [dictionary, setDictionary] = useState<Record<string, any>>();
    const [groups, setGroups] = useState<PuzzleGroup[]>([]);
    const [groupFormOpen, setGroupFormOpen] = useState<boolean>(false);
    const [groupFormTab, setGroupFormTab] = useState<number>(0);
    const [groupFormIndex, setGroupFormIndex] = useState<number>(0);
    const [groupPokemonPool, setGroupPokemonPool] = useState<Record<number, any[]>>({});
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [latestId, setLatestId] = useState<string>("daily");

    const rows = useWatch({ control: form.control, name: "rows", defaultValue: 4 });
    const cols = useWatch({ control: form.control, name: "cols", defaultValue: 4 });

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

    const getQueries = (formBody: any) => {
        let newQueries = new URLSearchParams();

        if (Object.entries.length <= 0) return "";
        Object.entries(formBody).forEach(([key, value]: any) => {
            if (!formBody[key] || !value) return;
            if (['categoryType', 'custom_groupname'].includes(key)) return;

            if (Array.isArray(value)) {
                value.forEach(v => newQueries.append(key, v));
            } else {
                newQueries.append(key, value);
            }
        });

        return "?"+newQueries.toString();
    }

    const setGroupQuery = (target: number, queries: string) => {
        const filters = form.watch(`groups.${target}`);

        if (filters.categoryType == "auto") {
            queries = getQueries(filters);
            setGroups(prevGroups => 
                prevGroups.map((group, index) =>
                    index === target
                    ? { ...group, query: queries }
                    : group
                )
            );
        } else {
            setGroups(prevGroups => 
                prevGroups.map((group, index) =>
                    index === target
                    ? { ...group, query: `${filters.custom_groupname.pt}|${filters.custom_groupname.en}` }
                    : group
                )
            );
        }
    }

    const submitPuzzle = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            const body = {
                password: process.env.NEXT_PUBLIC_API_AUTHORIZATION_BATCH,
                puzzle: {                    
                    from: 'admin',
                    author: 'admin',
                    rows: formWatch.rows,
                    cols: formWatch.cols,
                    challenge: formWatch.challenge,
                    date: formWatch.date == "" ? null : formWatch.date,
                    groups: groups
                }
            }
            const queries = ``;
            
            const [response] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/create`, {
                    method: 'POST', headers, body: JSON.stringify(body)
                }),
            ]);
            if (!response.ok) {
                const data = await response.json();
                const error = data.message ? data.message.split(':') : ["Um erro inesperado ocorreu"];
                setError(error[error.length - 1]);
                setLoading(false);
                return;
            }
            const [data] = await Promise.all([
                response.json(),
            ]);
            setLoading(false);
            setLatestId(data.data._id);
            setShowSuccessModal(true);
        } catch (e) {
            console.error(e);
            setError('Não foi possível conectar ao servidor. Tente novamente.');
            setLoading(false);
        }
    };
    
    const fetchPokemonPool = async (target: number, filters: any, queries: string) => {
        if (filters.categoryType == "auto") {
            queries = getQueries(filters);
        }

        const headers = { 'Content-Type': 'application/json' };
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get${queries}`, { method: 'GET', headers });
        const data = await response.json();

        setGroupPokemonPool(prev => ({
            ...prev,
            [target]: data.pokemons,
        }));
    }

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
                    setError('Erro ao obter informações.');
                    return;
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

    useEffect(() => {
        const filters = form.watch(`groups.${groupFormIndex}`);
        if (!filters) return;

        setGroupQuery(groupFormIndex, filters);
        if (groupFormTab == 1) {
            fetchPokemonPool(groupFormIndex, filters, "");
        }
    }, [groupFormOpen, groupFormIndex, groupFormTab]);

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

    const openGroupForm = (index: number, tab: number) => {
        setGroupFormOpen(true);
        setGroupFormIndex(index);
        setGroupFormTab(tab);
    };

    const selectPokemon = (pokemon: any, target: number) => {
        setGroups(prevGroups => 
            prevGroups.map((group, index) => {
                if (index !== target) return group;

                const isAlreadySelected = group.pokemons.some(p => p === pokemon.id);

                const response = {
                        ...group,
                        pokemons: isAlreadySelected
                        ? group.pokemons.filter(p => p !== pokemon.id)
                        : [...group.pokemons, pokemon.id],
                    }
                return response;
            })
        )
    };

    const optionRecords = useMemo(() => {
        let options: Record<string, Record<string, string>> = {};
        Object.entries(FIELD_OPTIONS).map(([key, range]) => {
            if (Array.isArray(range)) {
                options[key] = Object.fromEntries(range.map(item => [item, t(`groupnames.${key}.${item}`)]));
            } else {
                options[key] = rangeToRecord(key, range as Range);
            }
        });
        return options;
    }, [dictionary, t, rangeToRecord]);

    return (
        <>
            <Modal id={"puzzle-success"} isOpen={showSuccessModal} setIsOpen={setShowSuccessModal} canClose={true} background={true}>
                <div className="modal-content-div">
                    <p>
                        Puzzle criado com sucesso!
                    </p>
                </div>
                <div className="button-row">
                    <button className="modal-content-div" onClick={ () => window.open(`/puzzle/${latestId}`, '_blank') }>
                        <p>Visualizar</p>
                    </button>
                    <button className="modal-content-div" onClick={ () => redirect('/admin/puzzle') }>
                        <p>Voltar ao Painel</p>
                    </button>
                </div>
            </Modal>
            {dictionary == undefined ?
                <Loading expand={false} />
                :
                <>
                    <div id="click-catcher" onClick={() => setGroupFormOpen(false)}></div>
                    <section id="group-list" className={`cut-in ${groupFormOpen ? 'group-open' : ''} ${loading ? "loading-state" : ""}`}
                        style={{'--rows': rows, '--cols': cols} as React.CSSProperties}>
                        <div className="puzzle-header">
                            <p className="group-name">
                                Novo Puzzle
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
                            <button className="submit" onClick={submitPuzzle}>
                                Enviar
                            </button>
                        </div>

                        {rowCounter.map((rowIndex) => {
                            const group = groups[rowIndex];
                            return (
                                <div className="group-card cut-in" key={rowIndex}>
                                    <p className="group-name edit-hover" onClick={() => openGroupForm(rowIndex, 0)}>
                                        {group.query && group.query != "|" ?
                                            getGroupnameFromQuery(group.query, dictionary, t, locale, true)
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
                                            const options = optionRecords[key];
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
                                <label className="search-container">
                                    <Input type="text" name="search" form={form} placeholder={"Buscar"} />
                                    <SearchIcon />
                                </label>
                                {groupPokemonPool[groupFormIndex] && groupPokemonPool[groupFormIndex].map((pokemon: any) => (
                                    <ListBlock
                                        key={pokemon.id}
                                        pokemon={pokemon}
                                        multiselect={true}
                                        aspect="list"
                                        isSelected={groups[groupFormIndex].pokemons.includes(pokemon.id)}
                                        onSelect={()=>selectPokemon(pokemon, groupFormIndex)}
                                        onPress={()=>{}}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            }
        </>
    )
}
