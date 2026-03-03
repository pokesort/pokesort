'use client'

import { useInView } from 'react-intersection-observer';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import clsx from 'clsx';

import '@/src/styles/components/PokemonBlock.scss';
import PokeSprite from './PokeSprite';
import ShinyGif from '@/src/assets/images/shiny.gif';

interface BlockProps {
    pokemon: any;
    shinies: number[];
    multiselect: boolean;
    isSelected: boolean;
    isSolved?: boolean;
    isCorrect?: boolean;
    isIncorrect?: boolean;
    isAbandoned?: boolean;
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

export default React.memo(function PuzzleBlock({ pokemon, shinies, multiselect, isSelected, isSolved=false, isCorrect=false, isIncorrect=false, isAbandoned=false, onSelect, onPress }: BlockProps) {
    const default_url = !shinies.includes(pokemon.dex_number) ? pokemon.sprite_default : pokemon.sprite_shiny;
    
    const gifRef = useRef<any>(null);
    const [shiny, setShiny] = useState<boolean>(false);
    const [shinyReveal, setShinyReveal] = useState<boolean>(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setShiny(shinies.includes(pokemon.id));
    }, [shinies])

    useEffect(() => {
        if (shiny && shinyReveal) {
            const audio = new Audio("/audio/shiny.ogg");
            audio.volume = 0.5;
            audio.play().catch(err => console.warn("Autoplay blocked:", err));
            setTimeout(() => {
                gifRef.current?.remove();
            }, 900);
        }

    }, [shinyReveal])

    const handleThisBlockSelect = useCallback(() => {     
        if (shiny) setShinyReveal(true);
        onSelect(pokemon.id);
    }, [onSelect, pokemon.id, shinyReveal, shiny]);

    const handleRightClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            onPress(pokemon.id);
            },
        [onPress, pokemon.id]
    );

    const handleTouchStart = useCallback(() => {
        pressTimer.current = setTimeout(() => {
        onPress(pokemon.id);
        }, 600);
    }, [onPress, pokemon.id]);

    const handleTouchEnd = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    }, []);

    let p_name = pokemon.species_name.replaceAll('-', ' ');
    let p_surname = getSurname(pokemon.name, pokemon.species_name);

    const blockClasses = clsx(
        'pokemon-block',
        {
            'shiny': shiny,
            'solved': isSolved,
            'correct': isCorrect,
            'incorrect': isIncorrect,
            'abandoned': isAbandoned,
            'selected': isSelected,
        }
    );    

    return (
        <motion.label className="block-container"
            key={pokemon.id}
            layoutId={`pokemon-block-${pokemon.id}`}
            variants={itemVariants}
            transition={{ duration: 0.5, type: 'spring' }}
            onContextMenu={handleRightClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
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
            {shinyReveal && <>
                <img ref={gifRef} className="shiny-gif" src={ShinyGif.src}/>
            </>}
        </motion.label>
    )
})