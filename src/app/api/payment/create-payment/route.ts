import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ECPayService } from "@/lib/ecpay";
import { ExchangeRateService } from "@/lib/exchange-rate";
import { auth } from "@/auth";
import { orderEnum } from "@/types/statusEnum";

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

    // 2. 从请求中获取订阅计划ID
    const { planId, locale, callbackUrl } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { success: false, message: "缺少訂閱計劃ID" },
        { status: 400 },
      );
    }

    // 3. 获取订阅计划详情
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        lens: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "未找到該訂閱計劃" },
        { status: 404 },
      );
    }

    // 5. 准备绿界支付参数
    const ecpayService = new ECPayService();
    const language =
      locale === "tw"
        ? ""
        : locale === "jp"
          ? "JPN"
          : locale === "kr"
            ? "KOR"
            : locale === "en"
              ? "ENG"
              : "ENG";
    // 生成符合长度要求的交易编号
    const merchantTradeNo = ecpayService.generateMerchantTradeNo();
    const merchantTradeDate = ecpayService.generateMerchantTradeDate();

    // 使用匯率服務進行貨幣轉換
    let totalAmount = plan.price;
    let exchangeRate = 1;

    if (plan.currency === "USD") {
      const exchangeRateService = new ExchangeRateService();
      exchangeRate = await exchangeRateService.getUSDToTWDRate();
      totalAmount = await exchangeRateService.convertUSDToTWD(plan.price);
      console.log(
        `使用匯率API: 1 USD = ${exchangeRate} TWD, ${plan.price} USD = ${totalAmount} TWD`,
      );
    }

    // 4. 创建订单记录
    const newOrder = await prisma.order.create({
      data: {
        userId,
        totalAmount: totalAmount,
        originalAmount: plan.price,
        status: orderEnum.PENDING, // 初始状态为待付款
        paymentDetails: JSON.stringify({
          planId,
          planName: plan.name,
          planDuration: plan.duration,
          lensViewId: plan.lensViewId,
          merchantTradeNo: merchantTradeNo, // 保存绿界交易编号到订单详情
          currency: plan.currency,
          exchangeRate: exchangeRate,
        }),
      },
    });
    // 獲取基礎URL，優先使用環境變量，如果不存在則嘗試從請求中獲取
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // 使用專門的支付回調頁面處理重定向
    const orderData = {
      MerchantTradeNo: merchantTradeNo, // 使用生成的交易编号
      MerchantTradeDate: merchantTradeDate,
      TotalAmount: totalAmount, // 僅限新台幣
      PaymentType: "aio",
      TradeDesc: `${plan.name} - ${plan.duration}`,
      ItemName: `${plan.name} - ${plan.type}`,
      ChoosePayment: "ALL",
      EncryptType: 1,
      ReturnURL: `${baseUrl}/api/ecpay/notify`, // 後端處理支付結果的回調接口，負責處理訂單狀態和訂閱創建
      ClientBackURL: `${baseUrl}/${callbackUrl}?order_id=${newOrder.id}`, // 用戶點擊"返回商店"按鈕時跳轉的頁面
      OrderResultURL: `${baseUrl}/${callbackUrl}?order_id=${newOrder.id}`, // 支付完成後自動跳轉的頁面
      CustomField1: newOrder.id, // 将订单ID放入自定义字段，以便回调时能找到订单
      Language: language,
    };

    const { apiUrl, formData } = ecpayService.createPaymentForm(orderData);

    // 7. 返回表单数据和订单ID
    return NextResponse.json({
      success: true,
      apiUrl,
      formData,
      orderId: newOrder.id,
    });
  } catch (error) {
    console.error("創建支付訂單時出錯:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "處理支付訂單時發生未知錯誤",
      },
      { status: 500 },
    );
  }
}
