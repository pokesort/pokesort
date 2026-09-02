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
import { bool } from 'yup';
import { getDailyPokemon } from '../scripts/utils';
import LatestPuzzles from '../components/LatestPuzzles';

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
  isNew?: boolean;
}

const HomeCard = ({
  page, href, sprite, count=0, isNew=false
}: HomeCardProps) => {
  const t = useTranslations();
  const locale = useLocale();
  let commandAppend = "";
  let extraElement = null;
  let showCommand = true;

  switch (page) {
    case "daily":
      commandAppend = new Date().toLocaleDateString(locale, {
        day: '2-digit',
        month: 'long'
      });
    break;
    case "archive":
      showCommand = false;
      extraElement = (
        <LatestPuzzles limit={7} />
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
      
      <p>
        {isNew &&
          <span className="new-label">
            {t(`home.new-label`)}
          </span>
        }
        {t(`home.${page}.description`)}
      </p>

      {extraElement}

      {showCommand &&
        <Link href={href}>
          {t(`home.${page}.command`)}{commandAppend}
        </Link>
      }

      <PokeSprite slug={`${sprite}.png`} />
    </div>
  )
}

export default function Home() {
  const t = useTranslations();

  const [counts, setCounts] = useState<Record<string, number>>({"daily": 0, "infinite": 0});
  const [dailySprite, setDailySprite] = useState<string>(getDailyPokemon);
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

        <div className="home-card-group">
          <HomeCard
            page="daily"
            count={counts["daily"]}
            href="/daily"
            sprite={dailySprite}
          />
          <HomeCard
            page="archive"
            href="/archive"
            sprite={archiveSprite}
          />
        </div>

        <h2>{t(`home.modes`)}</h2>
        <div className="home-card-group">
          <HomeCard
            page="infinite"
            count={counts["infinite"]}
            href="/infinite"
            sprite="235"
          />
          <div>
            <p className="coming-soon">
              {t(`home.construction-1`)}<b>
                <Link href="/construction">
                  {t(`home.construction-2`)}
                </Link>
              </b>
            </p>
          </div>
        </div>

        <h2>{t(`home.extras`)}</h2>
        <div className="home-card-group">
          <HomeCard
            page="dex"
            href="/dex"
            sprite="479"
          />
          <HomeCard
            page="about"
            href="/about"
            sprite="441"
          />
        </div>

        <div className="home-button-group">
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-notices"))}>
            {t(`notices.label`)}
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-tutorial"))}>
            {t(`tutorial.label`)}
          </button>
          <button>
            {t(`home.transfer`)}
          </button>
        </div>

        <p id="disclaimer">
          {t(`home.disclaimer`)}
        </p>
      </main>

    </section>
  );
}
