import { NextResponse } from "next/server";
import { userPrisma } from "@/lib/prisma-multi";
import { auth } from "@/auth";
import { subscriptionEnum } from "@/types/statusEnum";

export const dynamic = "force-dynamic";

/**
 * 檢查用戶訂閱狀態的API
 */
export async function GET(request: Request) {
  try {
    // 檢查用戶認證
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const userId = session.user.id;

    // 查找用戶的所有有效訂閱
    const activeSubscriptions = await userPrisma.subscription.findMany({
      where: {
        userId: userId,
        status: subscriptionEnum.ACTIVE,
        endDate: {
          gte: new Date(), // 結束日期在當前日期之後
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: "desc", // 按結束日期降序排列，獲取最長有效的訂閱
      },
    });

    // 檢查是否有活躍訂閱
    const hasActiveSubscription = activeSubscriptions.length > 0;

    // 獲取即將到期的訂閱（30天內到期）
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSubscriptions = activeSubscriptions.filter(
      (sub) => sub.endDate <= thirtyDaysFromNow
    );

    // 整理訂閱信息
    const subscriptionInfo = {
      hasActiveSubscription,
      activeSubscriptions: activeSubscriptions.map((sub) => ({
        id: sub.id,
        planName: sub.plan.name,
        startDate: sub.startDate,
        endDate: sub.endDate,
        autoRenew: sub.autoRenew,
        isExpiring: sub.endDate <= thirtyDaysFromNow,
        daysRemaining: Math.ceil(
          (sub.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      expiringSubscriptionsCount: expiringSubscriptions.length,
    };

    return NextResponse.json(subscriptionInfo);
  } catch (error) {
    console.error("訂閱狀態檢查錯誤:", error);
    return NextResponse.json({ error: "訂閱狀態檢查失敗" }, { status: 500 });
  }
}
