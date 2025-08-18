"use client"

import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';

import "@/src/styles/components/Home.scss";
import SvgLogo from '../components/svg/SvgLogo';
import Link from 'next/link';
import GridIcon from '../components/svg/GridIcon';
import DexIcon from '../components/svg/DexIcon';
import CalendarIcon from '../components/svg/CalendarIcon';

import StreakIcon from '@/src/components/svg/StreakIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import { useEffect, useState } from 'react';

const streakKey = 'u_dailystreak';
const infiniteCount = 'u_infinitecount';

type Page = {
    route: string;
    label: string;
    description: string;
    icon: any;    
    countType?: 'streak' | 'count';
}



export default function Home() {
  const t = useTranslations();
  const [counts, setCounts] = useState<number[]>([]);

  const pages = [
      {route: '/daily', label: t('header.daily'), description: t('home.daily'), icon: <GridIcon/>, countType: 'streak'},
      {route: '/infinite', label: t('header.infinite'), description: t('home.infinite'), icon: <GridIcon/>, countType: 'count'},
      {route: '/archive', label: t('header.archive'), description: t('home.archive'), icon: <CalendarIcon/>},
      {route: '/dex', label: t('header.dex'), description: t('home.dex'), icon: <DexIcon/>},
  ] as Page[];

  useEffect(() => {
    const newCounts = [...counts];

    pages.map((page: Page, index: number) => {
      let streak = 0;
      if (page.countType != undefined) {

        if (page.countType != 'count') {
            const streakJson = localStorage.getItem(streakKey);
            if (streakJson != null) {
              const streakData = JSON.parse(streakJson);
              streak = streakData.streak;
            }
        } else {
            const streakData = localStorage.getItem(infiniteCount);
            if (streakData != null) streak = parseInt(streakData);
        }
      }
      newCounts[index] = streak;
    })

    setCounts(newCounts);
  }, [])

  return (
    <section id="home">
      <hgroup>
        <div className="logo">
          <SvgLogo/>
          <h1>POKESORT</h1>
        </div>
        <p>{t('home.subtitle')}</p>
      </hgroup>
      <nav>
        {pages.map((page: Page, index: number) => {
          let StreakCount = <></>

          if (page.countType != undefined && counts[index] > 0) {
            StreakCount = (
              <div>
                {page.countType != 'count' ?
                  <StreakIcon />
                :
                  <TickIcon />
                }
                <span>{counts[index]}</span>
              </div>
            )              
          }

          return (
            <Link key={index} href={page.route}>
              <hgroup className="card-title">
                <h3>{page.label}</h3>
                {StreakCount}
              </hgroup>
              <p>{page.description}</p>
              {page.icon}
            </Link>
          )
        })}
      </nav>
      <p id="disclaimer">
        {t(`home.disclaimer`)}
      </p>
    </section>
  );
}
