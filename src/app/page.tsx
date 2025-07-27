import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';

import "@/src/styles/components/Home.scss";
import SvgLogo from '../components/svg/SvgLogo';
import Link from 'next/link';
import GridIcon from '../components/svg/GridIcon';
import DexIcon from '../components/svg/DexIcon';
import CalendarIcon from '../components/svg/CalendarIcon';

type Page = {
    route: string;
    label: string;
    description: string;
    icon: any;
}

export default function Home() {
  const t = useTranslations();

  const pages = [
      {route: '/daily', label: t('header.daily'), description: t('home.daily'), icon: <GridIcon/>},
      {route: '/infinite', label: t('header.infinite'), description: t('home.infinite'), icon: <GridIcon/>},
      {route: '/archive', label: t('header.archive'), description: t('home.archive'), icon: <CalendarIcon/>},
      {route: '/dex', label: t('header.dex'), description: t('home.dex'), icon: <DexIcon/>},
  ] as Page[];

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
        {pages.map((page: Page, index: number) => (
          <Link key={index} href={page.route}>
            <h3>{page.label}</h3>
            <p>{page.description}</p>
            {page.icon}
          </Link>
        ))}
      </nav>
      <p id="disclaimer">
        {t(`home.disclaimer`)}
      </p>
    </section>
  );
}
