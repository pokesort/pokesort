"use client"

import { useTranslations } from 'next-intl';
import "@/src/styles/components/Home.scss";
import { useEffect, useState } from 'react';

export default function Home() {
  const t = useTranslations();  

  return (
    <>
      <p>
        {t('test')}
      </p>
    </>
  );
}
