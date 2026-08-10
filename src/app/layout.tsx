import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { headers } from "next/headers";

import "@/src/styles/layout.scss";
import { Montserrat } from 'next/font/google'
import HeaderClient from "../components/HeaderClient";
import Analytics from "../components/Analytics";
import AdSense from "../components/AdSense";
import AdSenseUnit from "../components/svg/AdSenseUnit";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--montserrat',
});

export const viewport: Viewport = {
  themeColor: "#12121B",
  colorScheme: "dark",
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return {
    title: {
      template: "Pokesort | %s",
      default: "Pokesort",
    },
    description: t('metadata.description'),
  };
}

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const locale = await getLocale();
  const headersList = await headers();
  const pathname = headersList.get('x-next-url') || '/';

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js").catch(console.error);
  }
  
  return (
    <html lang={locale}>
      <head>
        <Analytics />
        <AdSense />
        <link
            rel="preload"
            href="/AnimatedLoading.json"
            as="fetch"
            type="application/json"
            crossOrigin="anonymous"
          />
        <meta
          name="google-site-verification"
          content="3fxG3rWo7kt_S7p9eF8EuFPozHRH_1h298NsfriqrOk"
        />
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_API_BASE_URL}
        />
      </head>
      <NextIntlClientProvider>
        <body>
          <HeaderClient/>
          <section id="page">
              {children}
          </section>
          <AdSenseUnit slot="1909010821" />
        </body>
      </NextIntlClientProvider>      
    </html>
  );
}
