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
  openFilter: boolean;
  setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

type Range = {
  min: number;
  max: number;
}

function DexFilters ({queries, setQueries, openFilter, setOpenFilter}: DexFiltersProps) {
  const t = useTranslations();
  const form = useForm();
  const formWatch = form.watch();

  const [unlock, setUnlock] = useState<boolean>(false);

  function rangeToRecord(key: string, { min, max }: Range): Record<string, string> {
    const record: Record<string, string> = {};

    if (['weak', 'strong'].includes(key)) {
      key = 'types';
    }

    for (let i = min; i <= max; i++) {
      if (['abilities', 'moves'].includes(key)) {
        record[`${i}`] = `${i}`;
      } else {
        record[`${i}`] = `${t(`groupnames.${key}.${i}`)}`;
      }
    }
    return record;
  };

  useEffect(() => {

    const formTimeout = setTimeout(() => {
      const formBody = formWatch;
      formBody.search = formBody.search.replaceAll(' ', '-');
      for (const key in formBody) {
        if (formBody[key] === null || formBody[key] === false) {
          delete formBody[key];
        }
      }

      const newQueries = new URLSearchParams(formBody).toString();
      console.log(newQueries);
      setQueries(newQueries);
    }, 500);

    return () => clearTimeout(formTimeout);
  }, [formWatch, unlock]);

  const unlockFetch = () => {
    setUnlock(true);
  }

  return (
    <>
      <section id="dex-filters">
          <label className="search-container">
            <Input type="text" name="search" form={form} placeholder={"Buscar"} onInput={unlockFetch}/>
            <SearchIcon />
          </label>
          <button onClick={() => setOpenFilter((prev: boolean) => !prev)}>
            <FilterIcon />
            Filtros
          </button>
      </section>
      <div className={`filter-form ${openFilter ? 'open' : ''}`}>
        {Object.keys(FIELD_OPTIONS).map((key: string, index: number) => {
          const records: Record<string, unknown> = FIELD_OPTIONS;
          let options: Record<string, string> = {};
          if (Array.isArray(records[key])) {
            options = Object.fromEntries(records[key].map((item: string) => [item, t(`groupnames.${key}.${item}`)])) as Record<string, string>;
          } else {
            options = rangeToRecord(key, records[key] as Range);
          }

          return (
            <Input key={key} type="multiselect" label={t(`groupnames.${key}.short`)} name={key} form={form} options={options} />
          )
        })}
      </div>
    </>
  )
}

export default React.memo(function Home() {
  const t = useTranslations();
  const [pokemons, setPokemons] = useState<any[]>([]);
  const [queries, setQueries] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<number>();
  const [dexModalOpen, setDexModalOpen] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);

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
          <DexFilters queries={queries} setQueries={setQueries} openFilter={openFilter} setOpenFilter={setOpenFilter} />
          <ul id="dex-list" className={`${loading ? 'loading': ''} ${openFilter ? 'open-filter' : ''}`}>
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