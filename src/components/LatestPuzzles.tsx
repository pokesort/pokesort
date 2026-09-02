"use client";

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import clsx from 'clsx';
import { useLocale } from 'next-intl';

import Loading from '@/src/components/Loading';
import Shiny from '@/src/components/svg/Shiny';
import ErrorToast from '@/src/components/ToastError';
import { getPuzzleStatus } from '@/src/scripts/utils';

import "@/src/styles/components/Archive.scss";
import ArrowRight from './svg/ArrowRight';

interface LatestPuzzlesProps {
  limit?: number;
}

export default function LatestPuzzles({ limit = 7 }: LatestPuzzlesProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzles, setPuzzles] = useState<Record<string, string[]>>({});
  const locale = useLocale();

  useEffect(() => {
    const fetchLatestPuzzles = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/get?by=date&limit=${limit}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (!res.ok) {
          setError('Erro ao obter informações do arquivo.');
          return;
        }

        const data = await res.json();
        console.log(data.puzzles);
        setPuzzles(data.puzzles || {});
      } catch (err) {
        console.error(err);
        setError('Não foi possível conectar ao servidor. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPuzzles();
  }, [limit]);

  if (loading) {
    return <></>;
  }

  const today = new Date();
  const pastDays = Array.from({ length: limit }, (_, i) => subDays(today, i));

  return (
    <>
      <ErrorToast error={error} />
      <div className="latest-puzzles-list">
        <Link href={`archive`} className="calendar-cell">
            <ArrowRight />
        </Link>
        {pastDays.map((day) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const hasPuzzle = Boolean(puzzles[dayString]);
          const userData: any = hasPuzzle ? getPuzzleStatus(puzzles[dayString]) : null;

          const blockClasses = clsx(
                'calendar-cell',
                {
                    'attempted': userData != null,
                    'complete': userData && userData.status == 1,
                    'abandoned': userData && userData.status == -1
                }
            );

          return (
            <Link href={`puzzle/${dayString}`} key={dayString} className={blockClasses}>
                {day.toLocaleDateString(locale, { weekday: 'short' })}
                {userData && userData.shiny != undefined && userData.shiny.length > 0 && 
                    <div className="shiny"><Shiny /></div>
                }
            </Link>
          );
        })}
      </div>
    </>
  );
}