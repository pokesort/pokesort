"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Home.scss";
import { useEffect, useState } from 'react';

export default function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any>([]);

  const queries = window.location.href.split('?')[1];

  useEffect(() => {
    fetch(`http://localhost:3000//api/pokemon/get${queries ? '?'+queries : ''}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
      }).then((res) => res.json())
      .then((result) => {
          setPokemons(result.pokemons.sort((a: any, b: any) => a.dex_number < b.dex_number));
      })
  }, [])
  

  return (
    <>
      <ul>

        {pokemons && pokemons.map((p: any, index: number) => (
          <li key={index}>
            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}/>
            <p>{p.id}</p>
            <p>{p.name}</p>
          </li>
        ))}

      </ul>
    </>
  );
}
