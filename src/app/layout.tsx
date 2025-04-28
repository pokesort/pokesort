import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import "@/src/styles/layout.scss";
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--montserrat',
});

export const metadata: Metadata = {
  title: "Pokesort",
  description: "A daily Pokémon association puzzle",
};

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const locale = await getLocale();
  
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
