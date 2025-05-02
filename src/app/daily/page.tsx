"use client"

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import "@/src/styles/components/Puzzle.scss";
import Gradient from '@/src/components/Gradient';
import PokemonBlock from '@/src/components/PokemonBlock';

export default function Daily() {
    const t = useTranslations();
    const [pokemons, setPokemons] = useState<any>([]);
  
    useEffect(() => {  
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get?step=has_split`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
        }).then((res) => res.json())
        .then((result) => {
            setPokemons(result.pokemons);
        })
    }, [])

    return (
        <>
            <section className="puzzle">
                {pokemons && pokemons.map((p: any, index: number) => (
                    <PokemonBlock key={p.id} pokemon={p} multiselect={true} />
                ))}
            </section>
        </>
    )
}