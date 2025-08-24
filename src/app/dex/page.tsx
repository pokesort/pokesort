"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Dex.scss";
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ListBlock from '@/src/components/ListBlock';
import Modal from '@/src/components/Modal';
import DexView from '@/src/components/DexView';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';
import Input from '@/src/components/forms/Input';
import SearchIcon from '@/src/components/svg/SearchIcon';
import FilterIcon from '@/src/components/svg/FilterIcon';
import { FIELD_OPTIONS } from '@/src/scripts/utils';

interface DexFiltersProps {
  queries: string | undefined;
  setQueries: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function DexFilters ({queries, setQueries}: DexFiltersProps) {
  const t = useTranslations();
  const form = useForm();
  const formWatch = form.watch();

  const [unlock, setUnlock] = useState<boolean>(false);
  const [openFilterModal, setOpenFilterModal] = useState<boolean>(false);

  useEffect(() => {
    if (!unlock || openFilterModal) return;

    const formTimeout = setTimeout(() => {
      const formBody = formWatch;
      formBody.search = formBody.search.replaceAll(' ', '-');

      const newQueries = new URLSearchParams(formBody).toString();
      setQueries(newQueries);
    }, 500);

    return () => clearTimeout(formTimeout);
  }, [formWatch, unlock, openFilterModal]);

  const unlockFetch = () => {
    setUnlock(true);
  }

  return (
    <>
      <Modal id="filter-modal" background={true} isOpen={openFilterModal} setIsOpen={setOpenFilterModal} canClose={true}>
        <div style={{display: 'flex', flexDirection: 'column', maxWidth: '500px', gap: '0.5rem'}}>
          {Object.keys(FIELD_OPTIONS).map((key: string, index: number) => {
            return (
              <Input type="select" label={t(`groupnames.${key}.short`)} name={key} form={form} />
            )
          })}
        </div>
      </Modal>

      <section id="dex-filters">
        <label className="search-container">
          <Input type="text" name="search" form={form} placeholder={"Buscar"} onInput={unlockFetch}/>
          <SearchIcon />
        </label>
        <button onClick={() => setOpenFilterModal(true)}>
          <FilterIcon />
          Filtros
        </button>
      </section>
    </>
  )
}

export default React.memo(function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any[]>([]);
  const [queries, setQueries] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<number>();
  const [dexModalOpen, setDexModalOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [firstFetch, setFirstFetch] = useState<boolean>(true);

  useEffect(() => {
    const qs = window.location.href.split('?')[1];
    setQueries(qs || '');
  }, []);

  useEffect(() => {
    if (queries == undefined) return;

    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get?${queries}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
      }).then((res) => res.json())
      .then((result) => {
          setFirstFetch(false);
          setLoading(false);
          setPokemons(result.pokemons);
      })
  }, [queries])

  const handleSelect = useCallback((id: number) => {
    setSelected(id);
    setDexModalOpen(true);
  }, [])

  return (
    <>
      <Modal id="dex-modal" background={true} isOpen={dexModalOpen} setIsOpen={setDexModalOpen} canClose={true}>
        <DexView pokemonId={selected} />
      </Modal>
      {firstFetch ?
        <Loading expand={false} />
      :
        <section id="dex-section">
          <DexFilters queries={queries} setQueries={setQueries} />
          <ul id="dex-list" className={`${loading ? 'loading': ''}`}>
            {pokemons && pokemons.map((p: any, index: number) => (
              <ListBlock
                key={p.id}
                pokemon={p}
                multiselect={false}
                aspect="square"
                isSelected={false}
                onSelect={() => handleSelect(p.id)}
                onPress={() => handleSelect(p.id)}
              />
            ))}

          </ul>
        </section>
      }
    </>
  );
})