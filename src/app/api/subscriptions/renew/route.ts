import { NextResponse } from "next/server";
import { ECPayService } from "@/lib/ecpay";
import { ExchangeRateService } from "@/lib/exchange-rate";
import { userPrisma } from "@/lib/prisma-multi";
import { subscriptionEnum, orderEnum } from "@/types/statusEnum";

/**
 * 處理訂閱續訂的API
 * 可以由定時任務調用或手動調用
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { subscriptionId } = data;

    if (!subscriptionId) {
      return NextResponse.json({ error: "缺少訂閱ID" }, { status: 400 });
    }

    // 查找訂閱信息
    const subscription = await userPrisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "訂閱不存在" }, { status: 404 });
    }

    // 判斷是否可續訂
    if (
      subscription.status !== subscriptionEnum.ACTIVE ||
      !subscription.autoRenew
    ) {
      return NextResponse.json(
        {
          error: "訂閱無法續訂",
          reason: !subscription.autoRenew ? "未開啟自動續訂" : "訂閱狀態非激活",
        },
        { status: 400 }
      );
    }

    // 初始化綠界支付服務
    const ecpayService = new ECPayService();
    const merchantTradeNo = ecpayService.generateMerchantTradeNo();
    const merchantTradeDate = ecpayService.generateMerchantTradeDate();

    // 計算新的訂閱結束日期
    const startDate = new Date(subscription.endDate); // 從前一個訂閱結束時開始
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + subscription.plan.duration);

    // 進行貨幣轉換
    let totalAmount = subscription.plan.price;
    let exchangeRate = 1;

    if (subscription.plan.currency === "USD") {
      const exchangeRateService = new ExchangeRateService();
      exchangeRate = await exchangeRateService.getUSDToTWDRate();
      totalAmount = await exchangeRateService.convertUSDToTWD(
        subscription.plan.price
      );
      console.log(
        `續訂使用匯率API: 1 USD = ${exchangeRate} TWD, ${subscription.plan.price} USD = ${totalAmount} TWD`
      );
    }

    // 創建新的訂單
    const order = await userPrisma.order.create({
      data: {
        id: merchantTradeNo,
        userId: subscription.userId,
        totalAmount: totalAmount,
        status: orderEnum.PENDING,
        subscriptionId: subscription.id,
        originalAmount: subscription.plan.price,
        paymentDetails: JSON.stringify({
          planId: subscription.plan.id,
          lensViewId: subscription.lensViewId,
          currency: subscription.plan.currency,
          exchangeRate: exchangeRate,
        }),
      },
    });

    // 準備付款資料
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const itemName = `${subscription.plan.name} - 續訂`;

    const paymentData = ecpayService.createPaymentForm({
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: merchantTradeDate,
      TotalAmount: totalAmount, // 更新為轉換後的金額
      TradeDesc: "訂閱續訂付款",
      ItemName: itemName,
      ChoosePayment: "ALL",
      EncryptType: 1,
      ReturnURL: `${baseUrl}/api/payments/callback`,
      ClientBackURL: `${baseUrl}/subscriptions`,
      OrderResultURL: `${baseUrl}/subscriptions/${subscription.id}`,
      CustomField1: order.id, // 將訂單ID放入自定義字段，以便回調時能找到訂單
    });

    // 在付款成功後，callback API會更新訂閱的結束日期

    return NextResponse.json({
      success: true,
      orderId: order.id,
      subscriptionId: subscription.id,
      paymentData,
    });
  } catch (error) {
    console.error("訂閱續訂錯誤:", error);
    return NextResponse.json({ error: "訂閱續訂處理失敗" }, { status: 500 });
  }
}
