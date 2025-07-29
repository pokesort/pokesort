import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { headers } from "next/headers";

import "@/src/styles/layout.scss";
import { Montserrat } from 'next/font/google'
import HeaderClient from "../components/HeaderClient";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--montserrat',
});

export const metadata: Metadata = {
  title: "Pokesort",
  description: "A daily Pokémon association puzzle",

  keywords: "",
};

export const viewport: Viewport = {
  themeColor: "#12121B",
  colorScheme: "dark",  
}

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const locale = await getLocale();
  const headersList = await headers();
  const pathname = headersList.get('x-next-url') || '/';
  
  return (
    <html lang={locale}>
      <head>
        <link
            rel="preload"
            href="/AnimatedLoading.json"
            as="fetch"
            type="application/json"
            crossOrigin="anonymous"
          />
        <script src="https://unpkg.com/pokeapi-js-wrapper/dist/index.js"></script>
        <script src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/js/pokedex.js`}></script>
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
