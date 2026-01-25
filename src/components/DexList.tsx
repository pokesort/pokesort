"use client"

import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ListBlock from '@/src/components/ListBlock';
import Modal from '@/src/components/Modal';
import DexView from '@/src/components/DexView';
import Loading from '@/src/components/Loading';
import { useForm } from 'react-hook-form';
import Input from '@/src/components/forms/Input';
import SearchIcon from '@/src/components/svg/SearchIcon';
import FilterIcon from '@/src/components/svg/FilterIcon';
import { FIELD_OPTIONS, MAX_SELECT, toTitleCase } from '@/src/scripts/utils';
import ErrorToast from '@/src/components/ToastError';

interface DexFiltersProps {
  queries: string | undefined;
  setQueries: React.Dispatch<React.SetStateAction<string | undefined>>;
  openFilter: boolean;
  setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
  dictionary: Record<string, string[]> | undefined;
}

type Range = {
  min: number;
  max: number;
}

function DexFilters ({queries, setQueries, openFilter, setOpenFilter, dictionary}: DexFiltersProps) {
  const t = useTranslations();
  const form = useForm();
  const formWatch = form.watch();

  const [unlock, setUnlock] = useState<boolean>(false);

  const rangeToRecord = useCallback((key: string, { min, max }: Range): Record<string, string> => {
    const record: Record<string, string> = {};

    if (['weak', 'strong'].includes(key)) {
      key = 'types';
    }

    for (let i = min; i <= max; i++) {
      if (key == 'categories' && i == 16)
        continue;

      if (['abilities', 'moves'].includes(key)) {
        if (dictionary && dictionary[key]) {
            record[`${i}`] = `${toTitleCase(dictionary[key][i])}`;
        } else {
            record[`${i}`] = `${i}`;
        }
      } else {
        record[`${i}`] = `${toTitleCase(t(`groupnames.${key}.${i}`))}`;
      }
    }
    return record;
  }, [dictionary]);

  useEffect(() => {
    const formTimeout = setTimeout(() => {
      const formBody = formWatch;
      formBody.search = formBody.search.replaceAll(' ', '-');

      let newQueries = new URLSearchParams();

      if (Object.entries.length <= 0) return;
      Object.entries(formBody).forEach(([key, value]) => {
        if (!formBody[key]) return;

        if (Array.isArray(value)) {
          value.forEach(v => newQueries.append(key, v));
        } else {
          newQueries.append(key, value);
        }
      });

      setQueries(newQueries.toString());
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
          <button className={`${openFilter ? 'open' : ''}`} onClick={() => setOpenFilter((prev: boolean) => !prev)}>
            <FilterIcon />
            Filtros
          </button>
      </section>
      {dictionary != undefined &&
        <div className={`filter-form ${openFilter ? 'open' : ''}`}>
          <div className="window-container">
              <section className="window-info-row">
                  <FilterIcon />
                  <p>Filtros</p>
              </section>
          </div>
          <div className="filter-grid">
            {Object.keys(FIELD_OPTIONS).map((key: string, index: number) => {
              const records: Record<string, unknown> = FIELD_OPTIONS;

              let options: Record<string, string> = {};
              if (Array.isArray(records[key])) {
                options = Object.fromEntries(records[key].map((item: string) => [item, t(`groupnames.${key}.${item}`)])) as Record<string, string>;
              } else {
                options = rangeToRecord(key, records[key] as Range);
              }

              return (
                <Input key={key} type="multiselect"
                  max={MAX_SELECT[key as keyof typeof MAX_SELECT]}
                  label={t(`groupnames.${key}.short`)}
                  name={key} form={form} options={options}
                />
              )
            })}
          </div>
        </div>
      }
    </>
  )
}

export default React.memo(function DexList() {
  const t = useTranslations();

  const [pokemons, setPokemons] = useState<any[]>([]);
  const [queries, setQueries] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<number>();
  const [dexModalOpen, setDexModalOpen] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [dictionary, setDictionary] = useState<Record<string, string[]>>();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firstFetch, setFirstFetch] = useState<boolean>(true);

  useEffect(() => {
    const qs = window.location.href.split('?')[1];
    setQueries(qs || '');
  }, []);

  useEffect(() => {
    if (queries == undefined || !dictionary) return;

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
  }, [queries, dictionary]);

  useEffect(() => {
    const fetchDictionary = async () => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            const [abilitiesResponse, movesResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/abilities/get`, {
                    method: 'GET', headers
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/moves/get`, {
                    method: 'GET', headers
                }),
            ]);
            if (!abilitiesResponse.ok || !movesResponse.ok) {
                setError('Erro ao obter informações.');
            }
            const [abilitiesData, movesData] = await Promise.all([
                abilitiesResponse.json(),
                movesResponse.json(),
            ]);

            setDictionary({
              abilities: [null, ...abilitiesData.abilities],
              moves: [null, ...movesData.moves],
            });
        } catch (e) {
            console.error(e);
            setError('Não foi possível conectar ao servidor. Tente novamente.');
        } finally {                
            // setLoading(false);
        }
    };

    fetchDictionary();
  }, [])

  const handleSelect = useCallback((id: number) => {
    setSelected(id);
    setDexModalOpen(true);
  }, [])

  return (
    <>    
      <ErrorToast error={error} />
      <Modal id="dex-modal" background={true} isOpen={dexModalOpen} setIsOpen={setDexModalOpen} canClose={true}>
        <DexView pokemonId={selected} />
      </Modal>
      {firstFetch ?
        <Loading expand={false} />
      :
        <section id="dex-section">
          <DexFilters queries={queries} setQueries={setQueries} openFilter={openFilter} setOpenFilter={setOpenFilter} dictionary={dictionary} />
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