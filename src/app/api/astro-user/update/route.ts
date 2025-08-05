import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { projectPrisma } from '@/lib/project-prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { birthDate, birthTime, birthLocation } = body;

    // Validate required fields
    if (!birthDate || !birthLocation) {
      return NextResponse.json(
        { error: 'Birth date and location are required' },
        { status: 400 }
      );
    }

    // Parse dates
    const parsedBirthDate = new Date(birthDate);
    let parsedBirthTime = null;
    
    if (birthTime) {
      // Create a Date object for time with today's date (time only matters)
      const timeDate = new Date();
      const [hours, minutes] = birthTime.split(':');
      timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      parsedBirthTime = timeDate;
    }

    // Update astro_user record
    const updatedAstroUser = await projectPrisma.astroUser.update({
      where: {
        id: session.user.id,
      },
      data: {
        birthDate: parsedBirthDate,
        birthTime: parsedBirthTime,
        birthLocation: birthLocation.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAstroUser,
    });

  } catch (error) {
    console.error('Error updating astro user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}