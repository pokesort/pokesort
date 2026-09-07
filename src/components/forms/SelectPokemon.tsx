'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, SubmitHandler, FieldValues, UseFormReturn, useWatch } from "react-hook-form";
import { StaticImageData } from 'next/image';

import '@/src/styles/components/SelectPokemon.scss';
import SelectHandle from '../svg/SelectHandle';
import Modal from '../Modal';
import { useTranslations } from 'next-intl';
import Input, { InputProps } from './Input';
import Loading from '../Loading';
import PokeSprite from '../PokeSprite';
import SearchIcon from '../svg/SearchIcon';
import ListBlock from '../ListBlock';

interface SelectPokemonProps {
    label: string;
    name: string;
    form: UseFormReturn<FieldValues, any, FieldValues>
    defaultValue?: string | string[];
}

export default React.memo(function SelectPokemon({name, label, form, defaultValue=""}: SelectPokemonProps) {
    const t = useTranslations();

    const watched = form.watch(name);
    const searchForm = useForm();
    const search = searchForm.watch("search");

    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [pokemons, setPokemons] = useState<any[] | undefined>();
    const [selected, setSelected] = useState<string>(defaultValue as string);

    const fetchPokemon = async (search: string="") => {
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get${search ? `?search=${search}` : ""}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then((res) => res.json())
        .then((result) => {
            setLoading(false);
            setPokemons(result.pokemons);
        })
    }

    useEffect(() => {
        form.setValue(name, defaultValue);
    }, [])

    useEffect(() => {
        if (!open) {
            form.setValue(name, selected as string);
        }
    }, [open, selected])

    useEffect(() => {
        if (!open) return;

        const formTimeout = setTimeout(() => {            
            fetchPokemon(search);
        }, 500);

        return () => clearTimeout(formTimeout);
    }, [open, search])

    const handleSelect = useCallback((id: string) => {
        setSelected(id);
    }, []);

    return (
        <>
            <div className="form-label force-select" onClick={() => setOpen(true)}>
                {label && <span>{label}</span>}
                <div className="profile-sprite-container">
                    <PokeSprite slug={`${watched}.png`} />
                </div>
                <SelectHandle />
            </div>
            <Modal id="pokemon-select-modal" background={true} isOpen={open} canClose={true} setIsOpen={setOpen}>
                <label className="search-container">
                    <Input type="text" name="search" form={searchForm} placeholder={"Buscar"} />
                    <SearchIcon />
                </label>
                {loading ?
                    <Loading expand={true} />
                :
                    <>
                        {pokemons && pokemons.map((pokemon: any) => (
                            <ListBlock
                                key={pokemon.id}
                                pokemon={pokemon}
                                multiselect={false}
                                aspect="list"
                                isSelected={selected == pokemon.id}
                                onSelect={()=>handleSelect(pokemon.id)}
                                onPress={()=>{}}
                            />
                        ))}
                    </>
                }
            </Modal>
        </>
    )
})