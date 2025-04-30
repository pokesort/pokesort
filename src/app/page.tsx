"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Home.scss";
import { useEffect, useState } from 'react';
import Gradient from '../components/Gradient';

export default function Home() {
  const t = useTranslations();  

  return (
    <section className="page">
      <Gradient/>

      <p>
        {t('test')}
      </p>

    </section>
  );
}
