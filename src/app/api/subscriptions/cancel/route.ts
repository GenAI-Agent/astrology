import { NextResponse } from "next/server";
import { userPrisma } from "@/lib/prisma-multi";
import { auth } from "@/auth";
import { subscriptionEnum } from "@/types/statusEnum";

/**
 * 處理訂閱取消的API
 */
export async function POST(request: Request) {
  try {
    // 檢查用戶認證
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 獲取要取消的訂閱ID
    const data = await request.json();
    const { subscriptionId } = data;

    if (!subscriptionId) {
      return NextResponse.json({ error: "缺少訂閱ID" }, { status: 400 });
    }

    // 查找訂閱信息
    const subscription = await userPrisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "訂閱不存在" }, { status: 404 });
    }

    // 檢查是否為該用戶的訂閱
    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "無權操作此訂閱" }, { status: 403 });
    }

    // 檢查訂閱狀態是否可以取消
    if (subscription.status !== subscriptionEnum.ACTIVE) {
      return NextResponse.json(
        {
          error: "無法取消訂閱",
          reason: "訂閱狀態非激活",
        },
        { status: 400 }
      );
    }

    // 更新訂閱狀態為取消
    const cancelDate = new Date();
    await userPrisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: subscriptionEnum.CANCELLED,
        autoRenew: false,
        cancelledAt: cancelDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "訂閱已取消",
      cancelledAt: cancelDate,
      // 訂閱仍然有效直到當前訂閱週期結束
      validUntil: subscription.endDate,
    });
  } catch (error) {
    console.error("訂閱取消錯誤:", error);
    return NextResponse.json({ error: "訂閱取消處理失敗" }, { status: 500 });
  }
}
