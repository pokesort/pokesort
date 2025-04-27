import {useTranslations} from 'next-intl';
import "@/src/styles/components/Home.module.scss";

export default function Home() {
  const t = useTranslations();

  return (
    <>
      <p>{t('test')}</p>
    </>
  );
}
