import { useTranslations } from 'next-intl';
import "@/src/styles/components/Home.scss";
import { redirect } from 'next/navigation';

export default function Home() {
  const t = useTranslations();
  redirect('/daily');
  

  return (
    <section className="page">

      <p>
        {t('test')}
      </p>

    </section>
  );
}
