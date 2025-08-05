import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ECPayOrder } from "@/lib/ecpay";
import { auth } from "@/auth";
import { orderEnum, subscriptionEnum } from "@/types/statusEnum";

// POST /api/subscriptions - 创建一个新的订阅
export async function POST(request: Request) {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授權訪問" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const data = await request.json();
    const { planId, autoRenew = true } = data;

    if (!planId) {
      return NextResponse.json(
        { success: false, message: "订阅计划ID是必需的" },
        { status: 400 },
      );
    }

    // 查找订阅计划
    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: planId,
        status: 1, // 确保计划是激活的
      },
    });
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "找不到有效的用户" },
        { status: 404 },
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "找不到有效的订阅计划" },
        { status: 404 },
      );
    }

    // 计算订阅结束日期
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // 在数据库中创建订阅记录
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        autoRenew,
        status: subscriptionEnum.ACTIVE, // 初始状态为待支付
        lensViewId: plan.lensViewId,
      },
    });

    // 返回成功响应和绿界表单数据
    return NextResponse.json({
      success: true,
      message: "訂閱成功",
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("創建訂閱時出錯:", error);
    return NextResponse.json(
      { success: false, message: "創建訂閱時出錯" },
      { status: 500 },
    );
  }
}
