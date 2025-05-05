import { useTranslations } from 'next-intl';
import "@/src/styles/components/Home.scss";

export default function Home() {
  const t = useTranslations();  

  return (
    <section className="page">     

      <p>
        {t('test')}
      </p>

    </section>
  );
}
