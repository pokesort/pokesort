'use client';

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