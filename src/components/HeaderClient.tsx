'use client';

import { scan } from "react-scan";

if (process.env.NODE_ENV === "development") {
  scan();
}

import { usePathname } from 'next/navigation';
import Header from './Header';
import Gradient from './Gradient';

export default function HeaderClient() {
  const pathname = usePathname();
  return (
    <>
      <Header pathname={pathname || null} />
      <Gradient pathname={pathname || null} />
    </>
  )
}