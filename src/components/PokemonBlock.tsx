'use client'

import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';

import '@/src/styles/components/PokemonBlock.scss';
import fallback from '@/src/assets/images/pk_fallback.svg';

interface PokemonProps {
    pokemon: any,
    multiselect: boolean,
}

export default function PokemonBlock ({ pokemon, multiselect }: PokemonProps) {
    const [loadedImage, setLoadedImage] = useState<string | null>(null);
    
    const default_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const shiny_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;

    let p_name = pokemon.species_name.replaceAll('-', ' ');
    let p_surname = getSurname(pokemon.name, pokemon.species_name);

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    useEffect(() => {
        if (inView) {
            const img = new Image();
            img.src = default_url;
            img.onload = () => {
                setLoadedImage(default_url);
            };
        }
    }, [inView]);

    function getSurname(name: string, species_name: string) {

        let p_name = name.replace(species_name, '').split('-');
        let surname = '';
    
        if (p_name.length < 2) return surname;
    
        for (let i = 1; i < p_name.length; i++) {
            surname += ` ${p_name[i]}`
        }
    
        return surname;
    }

    return (
        <label ref={ref} key={pokemon.id} className="pokemon-block">
            <input type={multiselect ? 'checkbox' : 'radio'} name="pokemon[]" />
            <img src={loadedImage || fallback.src} />
            <h3>{p_name}</h3>
            {p_surname != '' && (
                <h4>{p_surname}</h4>
            )}
        </label>
    )
}