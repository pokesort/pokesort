"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Dex.scss";
import { useEffect, useState } from 'react';
import PokemonBlock from '@/src/components/PuzzleBlock';

export default function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any>([]);
  const [queries, setQueries] = useState<string>('');
  const [selected, setSelected] = useState<number>();

  function handleSelect (id: number) {
    setSelected(id);
  }

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
          <PokemonBlock
            key={p.id}
            pokemon={p}
            multiselect={false}
            isSelected={selected == p.id}
            onSelect={() => handleSelect(p.id)}
          />
        ))}

      </ul>
    </>
  );
}
