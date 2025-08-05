import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/project-client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'UserId is required'
      }, { status: 400 });
    }

    // 獲取該用戶的所有聊天會話
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // 轉換為 SessionHistory 格式
    const sessionHistories = sessions.map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      title: session.title,
      messages: [], // 在這個 API 中不返回訊息，只返回會話列表
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session._count.messages
    }));

    return NextResponse.json({
      success: true,
      data: sessionHistories
    });

  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}