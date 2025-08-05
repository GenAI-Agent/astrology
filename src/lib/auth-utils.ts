'use server';

import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function validateCurrentSession() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return { valid: false, reason: 'no_session' };
    }

    // Check if session exists in database
    const dbSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!dbSession) {
      // Session was deleted (user logged in from another device)
      return { valid: false, reason: 'session_deleted' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, reason: 'error' };
  }
}

export async function handleForceLogout() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.error('Force logout error:', error);
  }
}