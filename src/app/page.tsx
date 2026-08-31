"use client"

import { useLocale, useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';

import "@/src/styles/components/Home.scss";
import SvgLogo from '../components/svg/SvgLogo';
import Link from 'next/link';

import StreakIcon from '@/src/components/svg/StreakIcon';
import TickIcon from '@/src/components/svg/TickIcon';
import { useEffect, useState } from 'react';
import PokeSprite from '../components/PokeSprite';

const streakKey = 'u_dailystreak';
const infiniteCount = 'u_infinitecount';

type Page = {
    route: string;
    label: string;
    description: string;
    icon: any;    
    countType?: 'streak' | 'count';
}

interface HomeCardProps {
  page: string;
  href: string;
  sprite: string;
  count?: number;
}

const HomeCard = ({
  page, href, sprite, count=0
}: HomeCardProps) => {
  const t = useTranslations();
  const locale = useLocale();
  let commandAppend = "";
  let extraElement = null;

  switch (page) {
    case "daily":
      commandAppend = new Date().toLocaleDateString(locale, {
        day: '2-digit',
        month: 'long'
      });
    break;
    case "infinite":
      extraElement = (
        <p>Weekly archive goes here</p>
      )
    break;
  }

  return (
    <div className="home-card">
      <h3>
        {t(`header.${page}`)}
        {count > 1 &&
          <span>
            {count}
          </span>
        }
      </h3>
      <p>{t(`home.${page}.description`)}</p>

      {extraElement}

      <Link href={href}>
        {t(`home.${page}.command`)}{commandAppend}
      </Link>

      <PokeSprite slug={`${sprite}.png`} />
    </div>
  )
}

export default function Home() {
  const t = useTranslations();
  const [counts, setCounts] = useState<Record<string, number>>({"daily": 0, "infinite": 0});
  const [dailySprite, setDailySprite] = useState<string>("151");
  const [archiveSprite, setArchiveSprite] = useState<string>("251");

  useEffect(() => {
    const newCounts = {...counts};

    Object.keys(newCounts).forEach(mode => {
      let streak = 0;

      switch (mode) {

        case "daily":
          const streakJson = localStorage.getItem(streakKey);
          if (streakJson != null) {
            const streakData = JSON.parse(streakJson);
            streak = streakData.streak;
          }
          break;

        case "infinite":
          const streakData = localStorage.getItem(infiniteCount);
          if (streakData != null) {
            streak = parseInt(streakData);
          }
          break;

      }

      newCounts[mode] = streak;
    })

    console.log(newCounts);
    setCounts(newCounts);
  }, [])

  return (
    <section id="home">
      
      <main>
        <hgroup>
          <div className="logo">
            <SvgLogo/>
            <h1>POKESORT</h1>
          </div>
          <p>{t('home.subtitle')}</p>
        </hgroup>

        <HomeCard
          page="daily"
          count={counts["daily"]}
          href="/daily"
          sprite={dailySprite} />
        <HomeCard
          page="archive"
          href="/archive"
          sprite={archiveSprite} />

        <h2>{t(`home.modes`)}</h2>
        <HomeCard
          page="infinite"
          count={counts["infinite"]}
          href="/infinite"
          sprite="235" />

        <h2>{t(`home.extras`)}</h2>
        <HomeCard
          page="dex"
          href="/dex"
          sprite="479" />
        <HomeCard
          page="about"
          href="/about"
          sprite="441" />

        <p id="disclaimer">
          {t(`home.disclaimer`)}
        </p>
      </main>

    </section>
  );
}
