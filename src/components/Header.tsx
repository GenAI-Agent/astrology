'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-6">
      <div className="flex items-center">
        <Link href="/">
          <Image src="/logo/AstroFullLogoLightPurple.svg" alt="Astro Lens" width={100} height={100} className="h-8 w-auto cursor-pointer hover:opacity-90 transition-opacity" />
        </Link>
      </div>

      <nav className="flex items-center space-x-6">
        <Link
          href="/price"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Price
        </Link>

        {session?.user ? (
          <Link
            href="/astrology"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Start App
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}