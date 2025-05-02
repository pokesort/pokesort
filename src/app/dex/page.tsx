"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Dex.scss";
import { useEffect, useState } from 'react';
import PokemonBlock from '@/src/components/PokemonBlock';

export default function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any>([]);
  const [queries, setQueries] = useState<string>('');

  useEffect(() => {
    const qs = window.location.href.split('?')[1];
    setQueries(qs || '');

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get${qs ? '?'+qs : ''}`, {
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
      <ul>

        {pokemons && pokemons.map((p: any, index: number) => (
          <PokemonBlock key={p.id} pokemon={p} multiselect={false} />
        ))}

      </ul>
    </>
  );
}
