import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ valid: false, reason: 'no_session' });
    }

    // Check if session exists in database
    const dbSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!dbSession) {
      return NextResponse.json({ valid: false, reason: 'session_deleted' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, reason: 'error' });
  }
}