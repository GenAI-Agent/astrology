import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/project-client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "UserId and sessionId are required",
        },
        { status: 400 }
      );
    }

    // 獲取特定會話及其所有訊息
    const session = await prisma.chatSession.findFirst({
      where: {
        sessionId: sessionId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: {
            messageOrder: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session not found",
        },
        { status: 404 }
      );
    }

    // 轉換訊息格式以符合 Message 介面
    const messages = session.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      type: msg.messageType,
      messageOrder: msg.messageOrder,
      createdAt: msg.createdAt,
      score: msg.score,
      note: msg.note,
      // 工具相關欄位
      ...(msg.toolId && {
        tool_id: msg.toolId,
        tool_name: msg.toolName,
        tool_args: msg.toolArgs,
        tool_result: msg.toolResult,
      }),
      // 文本相關欄位
      ...(msg.sources && { sources: msg.sources }),
      ...(msg.prompts && { prompts: msg.prompts }),
      // choose_agent 相關欄位
      ...(msg.messageType === "choose_agent" && {
        agent: (msg.toolArgs as any)?.agent || "",
      }),
    }));

    const sessionHistory = {
      sessionId: session.sessionId,
      userId: session.userId,
      title: session.title,
      messages: messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: sessionHistory,
    });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "UserId and sessionId are required",
        },
        { status: 400 }
      );
    }

    // 檢查會話是否存在且屬於該用戶
    const session = await prisma.chatSession.findFirst({
      where: {
        sessionId: sessionId,
        userId: userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session not found",
        },
        { status: 404 }
      );
    }

    // 刪除會話（由於有 CASCADE，相關的訊息也會被刪除）
    await prisma.chatSession.delete({
      where: {
        id: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
