"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Dex.scss";
import React, { useCallback, useEffect, useState } from 'react';
import ListBlock from '@/src/components/ListBlock';
import Modal from '@/src/components/Modal';
import DexView from '@/src/components/DexView';

export default React.memo(function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any>([]);
  const [queries, setQueries] = useState<string>('');
  const [selected, setSelected] = useState<number>();
  const [dexModalOpen, setDexModalOpen] = useState<boolean>(false);

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

  const handleSelect = useCallback((id: number) => {
    setSelected(id);
    setDexModalOpen(true);
  }, [])

  return (
    <>
      <Modal id="dex-modal" background={true} isOpen={dexModalOpen} setIsOpen={setDexModalOpen} canClose={true}>
        <DexView pokemonId={selected} />
      </Modal>
      <ul id="dex-page">
        {pokemons && pokemons.map((p: any, index: number) => (
          <ListBlock
            key={p.id}
            pokemon={p}
            multiselect={false}
            isSelected={false}
            onSelect={() => handleSelect(p.id)}
            onPress={() => handleSelect(p.id)}
          />
        ))}

      </ul>
    </>
  );
})