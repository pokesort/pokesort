"use client"

import { useTranslations } from 'next-intl';

import "@/src/styles/components/Home.scss";
import SvgLogo from '../components/svg/SvgLogo';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { getDailyPokemon } from '../scripts/utils';
import HomeCard from '../components/HomeCatd';

const streakKey = 'u_dailystreak';
const infiniteCount = 'u_infinitecount';

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
