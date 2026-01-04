import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { headers } from "next/headers";

import "@/src/styles/layout.scss";
import { Montserrat } from 'next/font/google'
import HeaderClient from "../components/HeaderClient";
import Analytics from "../components/Analytics";

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
        <link
            rel="preload"
            href="/AnimatedLoading.json"
            as="fetch"
            type="application/json"
            crossOrigin="anonymous"
          />
      </head>
      <NextIntlClientProvider>
        <body>
          <HeaderClient/>
          <section id="page">
              {children}
          </section>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
