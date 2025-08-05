import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/orders/[id] - 获取特定订单的详细信息
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "訂單ID是必需的" },
        { status: 400 },
      );
    }

    // 验证用户是否已登录
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授權訪問" },
        { status: 401 },
      );
    }

    // 获取订单信息，包括相关的订阅信息
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "找不到訂單" },
        { status: 404 },
      );
    }

    // 验证订单是否属于当前用户
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "未授權訪問此訂單" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return NextResponse.json(
      { success: false, message: "獲取訂單詳情時出錯" },
      { status: 500 },
    );
  }
}
