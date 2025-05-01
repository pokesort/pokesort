import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { headers } from "next/headers";

import "@/src/styles/layout.scss";
import { Montserrat } from 'next/font/google'
import HeaderClient from "../components/HeaderClient";
import Gradient from "../components/Gradient";

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
  console.log(pathname);
  
  return (
    <html lang={locale}>
      <head></head>
      <NextIntlClientProvider>
        <body>
          <HeaderClient/>
          <Gradient/>
          <section id="page">          
              {children}          
          </section>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
