'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderClient() {
  const pathname = usePathname();
  return <Header pathname={pathname || null} />;
}