"use client"

import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import '@/src/styles/components/DexView.scss';
import helpDexImage from '@/src/assets/images/help_dex.png';
import Loading from './Loading';
import { REGIONALS, toTitleCase, includesAnySubstring, compareArrays } from '../scripts/utils';
import PokeSprite from './PokeSprite';
import IconType from './IconType';

const processVarieties = (pokemon: any) => {
    // Process chain
    if (pokemon.chain) {
        const chain_id = pokemon.chain[0].chain_id;
        pokemon.chain = pokemon.chain.filter((s: any) => s.chain_id == chain_id).sort((a: any, b: any) => a.step - b.step);
        const length = pokemon.chain.length;

        pokemon.chain = pokemon.chain.map((mon: any, index: number) => {
            // Remover formas alternativas redundantes da chain
            console.log(pokemon.chain.filter((s: any) => s.dex_number == mon.dex_number && compareArrays(s.methods, mon.methods)).length);
            if (index > 0 && mon.id > 10000 && pokemon.chain.filter((s: any) => s.dex_number == mon.dex_number && compareArrays(s.methods, mon.methods)).length > 1)
                return null;
            if (mon.id < 10000) mon.name = mon.species_name;
            if (mon.id == pokemon.id && mon.is_split) pokemon.is_split = 1;
            if (mon.id == pokemon.id && mon.has_split) pokemon.has_split = 1;
            if (mon.step_override != null) return mon;

            if (length <= 1 || pokemon.chain.filter((s: any) => s.step == 0).length == length) {
                mon.step_override = 'no_line';
                return mon;
            }

            if (mon.step == 0) {
                mon.step_override = 'first';
            } else if (mon.step == 1 && pokemon.chain.filter((s: any) => s.step == 2).length > 0) {
                mon.step_override = 'middle';
            } else {
                mon.step_override = 'final';
            }

            return mon;
        }).filter((mon: any) => mon !== null);
    } else {
        pokemon.chain = [{
            id: pokemon.id,
            dex_number: pokemon.dex_number,
            name: pokemon.name,
            species_name: pokemon.species_name,
            step_override: 'no_line',
            methods: [],
            sprite_default: pokemon.sprite_default
        }]
    }

    // Process other forms
    if (!pokemon.other_forms) pokemon.other_forms = [];
    pokemon.other_forms.push({
        id: pokemon.id,
        dex_number: pokemon.dex_number,
        name: pokemon.name,
        species_name: pokemon.species_name,
        sprite_default: pokemon.sprite_default
    });
    pokemon.other_forms = pokemon.other_forms.sort((a: any, b: any) => a.id - b.id);
    
    pokemon.other_forms = pokemon.other_forms.map((mon: any) => {
        if (mon.id < 10000) {
            mon.form_class = 'original';
            return mon;
        }

        if (mon.name.includes('-mega')) {
            mon.form_class = 'mega';
        } else if (mon.name.includes('-gmax')) {
            mon.form_class = 'gmax';
        } else if (includesAnySubstring(mon.name, REGIONALS)) {
            mon.form_class = 'regional';
        } else {
            mon.form_class = 'alternate';
        }

        return mon;
    })

    if (process.env.NODE_ENV === "development") {
        console.log(pokemon);
    }

    return pokemon;
}

interface DexDataProps {
    pokemon: any;
    setSearchId: React.Dispatch<React.SetStateAction<number>>;
}

const DexData = React.memo(({pokemon, setSearchId}: DexDataProps) => {
    const t = useTranslations();
    const default_url = pokemon.sprite_default;

    const [currentTab, setCurrentTab] = useState<number>(0);

    const processedShape = useMemo(() => {
        let shape = t(`groupnames.shape.${pokemon.shape}`);
        if (pokemon.shape != 'upright') {
            shape = shape.replaceAll('com ', '');
            shape = shape.replaceAll('de ', '');
        }
        shape = shape.replaceAll('-shaped', '');
        return shape;
    }, [pokemon])

    return (
        <section className="dex-view">
            <div className="v-group sticky">
                <div className="h-group">
                    <div className="sprite-block">
                        <PokeSprite url={default_url} />
                    </div>
                    <div className="v-group">
                        <div className="block">
                            <span>#{String(pokemon.dex_number).padStart(4, '0')}</span>{toTitleCase(pokemon.name)}
                        </div>
                        <div className="h-group">
                            <div className="block">
                                {t(`groupnames.generation.long`)}{t(`groupnames.generation.${pokemon.generation}`)}
                            </div>
                            <div className="block">
                                {toTitleCase(pokemon.region)}
                            </div>
                        </div>
                        <div className="block">
                            {pokemon.types.map((type: string, index: number) => (
                                <div key={index} className="type">
                                    <IconType folder="types" item={type} />
                                    <p>{t(`groupnames.types.${type}`)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="h-group">
                    <button className={`tab ${currentTab == 0 ? 'active' : ''}`} onClick={() => setCurrentTab(0)}>
                        {t(`puzzle.dex-tabs.traits`)}
                    </button>
                    <button className={`tab ${currentTab == 1 ? 'active' : ''}`} onClick={() => setCurrentTab(1)}>
                        {t(`puzzle.dex-tabs.moves`)}
                    </button>
                    <button className={`tab ${currentTab == 2 ? 'active' : ''}`} onClick={() => setCurrentTab(2)}>
                        {t(`puzzle.dex-tabs.related`)}
                    </button>
                </div>
            </div>
            {currentTab == 0 &&
                <div className="v-group">
                    <div className="block">
                        <span>{t(`groupnames.abilities.short`)}:</span>
                        {pokemon.abilities.map((ability: string, index: number) => (
                            <div className="map-container" key={index}>
                                <p>{toTitleCase(ability)}</p>
                                {index != pokemon.abilities.length-1 ? <span>|</span> : <></>}
                            </div>
                        ))}
                    </div>
                    <div className="h-group">
                        <div className="block">
                            <IconType folder="shape" item={pokemon.shape} /><p>{processedShape}</p>
                        </div>                        
                        <div className="block">
                            <IconType folder="color" item={pokemon.color} /><p>{t(`groupnames.color.${pokemon.color}`)}</p>
                        </div>
                    </div>
                    <div className="block">
                        <span>{t(`groupnames.egg-groups.short`)}:</span>
                        {pokemon.egg_groups.map((group: string, index: number) => (
                            <div className="map-container" key={index}>
                                <p>{t(`groupnames.egg-groups.${group}`)}</p>
                                {index != pokemon.egg_groups.length-1 ? <span>|</span> : <></>}
                            </div>
                        ))}
                    </div>
                    <div className="block">
                        <span>{t(`groupnames.habitat.short`)}:</span>
                        <p>{pokemon.habitat != "" ? t(`groupnames.habitat.${pokemon.habitat}`) : "N/A"}</p>
                    </div>
                    <div className="block">
                        <span>{t(`puzzle.dex-tabs.received-damage`)}:</span>
                    </div>
                    <div className="type-chart">
                        {Object.keys(pokemon.type_matchups).map((type: string, index: number) => (
                            <IconType key={`icon-${index}`} folder="types" item={type} expand={true} />
                        ))}
                        {Object.keys(pokemon.type_matchups).map((type: string, index: number) => (
                            <p key={`p-${index}`} data-matchup={pokemon.type_matchups[type]}>
                                {pokemon.type_matchups[type]}x
                            </p>
                        ))}
                    </div>
                    <div className="block">
                        <span>{t(`groupnames.categories.plural`)}:</span>
                    </div>
                    <div className="categories">
                        {pokemon.categories.length > 0 || pokemon.is_split || pokemon.has_split ?
                        <>
                            {pokemon.categories.map((category: string, index: number) => (
                                <p key={index}>{t(`groupnames.categories.${category}`)}</p>
                            ))}
                            {pokemon.is_split && <p>{t(`groupnames.step.is_split`)}</p>}
                            {pokemon.has_split && <p>{t(`groupnames.step.has_split`)}</p>}
                        </>
                        :
                            <p>N/A</p>
                        }
                    </div>
                </div>
            }
            {currentTab == 1 &&
                <div className="v-group">
                    <div className="block dark">
                        <span>{t(`puzzle.dex-tabs.moves-level`)}</span>
                    </div>

                    {pokemon.moves.map(( move: any, index: any) => (
                        <div key={index} className="block">
                            <IconType key={`icon-${index}`} folder="types" item={move.type} />
                            <p key={index}>{toTitleCase(move.name)}</p>
                        </div>
                    ))}
                </div>
            }
            {currentTab == 2 &&
                <div className="v-group">
                    <div className="block dark">
                        <span>{t(`puzzle.dex-tabs.evolution-chain`)}</span>
                    </div>

                    {pokemon.chain.map((step: any, index: number) => (
                        <div className="h-group" key={index} style={{cursor: 'pointer'}}
                        onClick={() => setSearchId(step.id)} title={t(`puzzle.dex-tabs.move_to`)+toTitleCase(step.name)}>
                            <div className="sprite-block">
                                <PokeSprite url={step.sprite_default} />
                            </div>
                            <div className="v-group">
                                <div className="h-group">
                                    <div className="block">
                                        {toTitleCase(step.name)}
                                    </div>
                                    <div className="block">
                                        <p>{t(`groupnames.form.${step.step_override}`)}</p>
                                    </div>
                                </div>
                                <div className="block">
                                    <span>{t(`groupnames.short_methods.short`)}:</span>
                                    {step.methods.length > 0 ?
                                        step.methods.map((method: string, index: number) => (
                                            <div className="map-container" key={index}>
                                                <p>{t(`groupnames.short_methods.${method}`)}</p>
                                                {index != step.methods.length-1 ? <span>+</span> : <></>}
                                            </div>
                                        ))
                                    :
                                        <p>N/A</p>
                                    }
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="block dark">
                        <span>{t(`puzzle.dex-tabs.varieties`)}</span>
                    </div>
                    {pokemon.other_forms.map((step: any, index: number) => (
                        <div className="h-group" key={index} style={{cursor: 'pointer'}}
                        onClick={() => setSearchId(step.id)} title={t(`puzzle.dex-tabs.move_to`)+toTitleCase(step.name)}>
                            <div className="sprite-block">
                                <PokeSprite url={step.sprite_default} />
                            </div>
                            <div className="v-group">
                                <div className="h-group">
                                    <div className="block">
                                        {toTitleCase(step.name)}
                                    </div>
                                </div>
                                <div className="block">
                                    <span>{t(`puzzle.dex-tabs.class`)}:</span>
                                    <p>{t(`puzzle.dex-tabs.form_class.${step.form_class}`)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </section>
    )
})

interface DexViewProps {
    pokemonId?: number;
}

export default function DexView ({ pokemonId }: DexViewProps) {
    const t = useTranslations();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [pokemon, setPokemon] = useState<any>();
    const [searchId, setSearchId] = useState<number>(pokemonId || 0);

    useEffect(() => {
        setSearchId(pokemonId || 0);
    }, [pokemonId])

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            if (!searchId || searchId == 0) return;

            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [dexResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/dex?id=${searchId}`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!dexResponse.ok) {
                    throw new Error('Erro ao obter informações da Dex.');
                }
                const [dexData] = await Promise.all([
                    dexResponse.json(),
                ]);                             

                setPokemon(processVarieties(dexData.pokemon));
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                
                setLoading(false);
            }
        };

        fetchPageData();
    }, [searchId])

    return (
        <>
        {searchId ?
            !loading ?
                <DexData pokemon={pokemon} setSearchId={setSearchId} />
                :
                <Loading expand={true} />
            :
            <div className="tab-help">
                <img src={helpDexImage.src}/>
                <p>{t('puzzle.help.dex')}</p>
            </div>
        }
        </>        
    )
}