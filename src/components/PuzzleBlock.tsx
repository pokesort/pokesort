'use client'

import { useInView } from 'react-intersection-observer';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import clsx from 'clsx';

import '@/src/styles/components/PokemonBlock.scss';
import PokeSprite from './PokeSprite';

interface BlockProps {
    pokemon: any;
    multiselect: boolean;
    isSelected: boolean;
    isSolved?: boolean;
    isCorrect?: boolean;
    isIncorrect?: boolean;
    onSelect: (id: number) => void;
    onPress: (id: number) => void;
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

export default React.memo(function PuzzleBlock({ pokemon, multiselect, isSelected, isSolved=false, isCorrect=false, isIncorrect=false, onSelect, onPress }: BlockProps) {
    const default_url = pokemon.sprite_default;
    const shiny_url = pokemon.sprite_shiny;

    const handleThisBlockSelect = useCallback(() => {
        onSelect(pokemon.id);
    }, [onSelect, pokemon.id]);

    const handleRightClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onPress(pokemon.id);
    }, [onPress, pokemon.id]);

    let p_name = pokemon.species_name.replaceAll('-', ' ');
    let p_surname = getSurname(pokemon.name, pokemon.species_name);

    const blockClasses = clsx(
        'pokemon-block',
        {
            'solved': isSolved,
            'correct': isCorrect,
            'incorrect': isIncorrect,
            'selected': isSelected,
        }
    );

    return (
        <motion.label className="block-container"
            key={pokemon.id}
            layoutId={`pokemon-block-${pokemon.id}`}
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, type: 'spring' }}
            onContextMenu={handleRightClick}
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
                <PokeSprite slug={default_url} />
                <h3>{p_name}</h3>
                {p_surname != '' && (
                    <h4>{p_surname}</h4>
                )}
            </div>
        </motion.label>
    )
})