'use client'

import { useInView } from 'react-intersection-observer';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import '@/src/styles/components/PokemonBlock.scss';
import fallback from '@/src/assets/images/pk_fallback.svg';

interface BlockProps {
    pokemon: any;
    multiselect: boolean;
    isSelected: boolean;
    isSolved: boolean;
    isIncorrect: boolean;
    onSelect: (id: number) => void;
}

const itemVariants: Variants = {
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
        type: 'tween'
    }
  }
};

function getSurname(name: string, species_name: string) {
    let p_name = name.replace(species_name, '').split('-');
    let surname = '';

    if (p_name.length < 2) return surname;

    for (let i = 1; i < p_name.length; i++) {
        surname += ` ${p_name[i]}`
    }

    return surname;
}

export default React.memo(function PuzzleBlock({ pokemon, multiselect, isSelected, isSolved, isIncorrect, onSelect }: BlockProps) {
    const [loadedImage, setLoadedImage] = useState<string | null>(null);
    
    const default_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const shiny_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    const handleThisBlockSelect = useCallback(() => {
        onSelect(pokemon.id);
    }, [onSelect, pokemon.id]);

    let p_name = pokemon.species_name.replaceAll('-', ' ');
    let p_surname = getSurname(pokemon.name, pokemon.species_name);

    const blockClasses = `pokemon-block ${isSolved ? 'permaselect correct' : ''} ${isIncorrect ? 'incorrect' : ''}`;

    useEffect(() => {
        if (inView) {
            const img = new Image();
            img.src = default_url;
            img.onload = () => {
                setLoadedImage(default_url);
            };
        }
    }, [inView]);

    return (
        <motion.label ref={ref} className="block-container"
            key={pokemon.id}
            layoutId={`pokemon-block-${pokemon.id}`}
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, type: 'spring' }}
        >
            <div className={blockClasses}>
                <input
                    type={multiselect ? 'checkbox' : 'radio'}
                    name="pokemon"
                    value={pokemon.id}
                    checked={isSelected}
                    onChange={handleThisBlockSelect} 
                    hidden
                />
                <img src={loadedImage || fallback.src} />
                <h3>{p_name}</h3>
                {p_surname != '' && (
                    <h4>{p_surname}</h4>
                )}
            </div>
        </motion.label>
    )
})