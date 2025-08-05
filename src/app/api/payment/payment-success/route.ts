import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { orderEnum, subscriptionEnum } from "@/types/statusEnum";

export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户会话，确认用户已登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "未授权，請先登錄" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // 2. 从请求中获取订单ID
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "缺少訂單ID" },
        { status: 400 },
      );
    }

    // 3. 查询订单，确保订单存在
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "未找到訂單" },
        { status: 404 },
      );
    }

    // 4. 确认订单属于当前用户
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "無權訪問此訂單" },
        { status: 403 },
      );
    }

    // 5. 查询该订单关联的订阅（如果存在）
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        orders: {
          some: {
            id: orderId,
          },
        },
      },
    });

    // 6. 返回订单和订阅状态
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
          }
        : null,
      isPaid: order.status === orderEnum.PAID,
      hasSubscription: !!subscription,
    });
  } catch (error) {
    console.error("處理支付查詢時出錯:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "處理支付查詢時發生未知錯誤",
      },
      { status: 500 },
    );
  }
}
