'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface TrainingDataLayoutProps {
  children: ReactNode;
}

const AUTHORIZED_USER_IDS = [
  'cmag7l9w20000qkqv6vhags4b',
  'cma8q2cq50000atkba9nupkeh'
];

export default function TrainingDataLayout({ children }: TrainingDataLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/training-data');
      return;
    }

    if (session?.user?.id && !AUTHORIZED_USER_IDS.includes(session.user.id)) {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (session?.user?.id && !AUTHORIZED_USER_IDS.includes(session.user.id)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}