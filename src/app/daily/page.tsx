"use client"

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import "@/src/styles/components/Puzzle.scss";
import PokemonBlock from '@/src/components/PuzzleBlock';

export default function Daily() {
    const t = useTranslations();

    const rows = 4;
    const cols = 4;

    const [pokemons, setPokemons] = useState<any>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pause, setPause] = useState<boolean>(false);

    function handleSelect(id: number) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }
  
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

    useEffect(() => {
      console.log(selectedIds);
      if (selectedIds.length >= cols) {
        const selected = document.querySelectorAll('label:has(input:checked)');
        setPause(true);
        setTimeout(() => {
            selected.forEach(s => {
                s.classList.add('incorrect');
            })
        }, 200);
        setTimeout(() => {
            selected.forEach(s => {
                s.classList.remove('incorrect');
            })
            setSelectedIds([]);
            setPause(false);
        }, 800);
      }

    }, [selectedIds])
    

    return (
        <>
            <section className={`puzzle disable-select ${pause ? 'pause' : ''}`}>
                {pokemons && pokemons.map((p: any, index: number) => (
                    <PokemonBlock
                        key={p.id}
                        pokemon={p}
                        multiselect={true}
                        isSelected={selectedIds.includes(p.id)}
                        onSelect={() => handleSelect(p.id)}
                    />
                ))}
            </section>
        </>
    )
}