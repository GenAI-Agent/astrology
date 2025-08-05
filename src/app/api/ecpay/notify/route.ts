import { NextRequest } from "next/server";
import { ECPayService } from "@/lib/ecpay";
import { prisma } from "@/lib/prisma";
import { orderEnum, subscriptionEnum } from "@/types/statusEnum";

export async function POST(request: NextRequest) {
  try {
    // 1. 获取 Ecpay 支付通知数据
    const formData = await request.formData();

    // 2. 转换 FormData 为对象
    const callbackData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      callbackData[key] = value;
    }

    console.log("收到 ECPay 支付通知:", callbackData);

    // 3. 验证支付通知的真实性
    const ecpayService = new ECPayService();
    const isValid = ecpayService.verifyCallback(callbackData);

    if (!isValid) {
      console.error("ECPay 支付通知验证失败");
      return new Response("0|ErrorMessage", {
        status: 400,
      });
    }

    // 4. 获取订单 ID（从CustomField1字段获取）
    const orderId = callbackData.CustomField1;
    if (!orderId) {
      console.error("ECPay 支付通知缺少订单 ID");
      return new Response("0|Missing Order ID", {
        status: 400,
      });
    }

    // 5. 确认支付是否成功
    // Ecpay 的返回码：1 表示成功，其他值表示失败
    const isPaymentSuccess = callbackData.RtnCode === "1";

    // 6. 查询订单，确保订单存在
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error("未找到訂單:", orderId);
      return new Response("0|Order Not Found", {
        status: 404,
      });
    }

    // 获取交易编号，记录到日志
    const merchantTradeNo = callbackData.MerchantTradeNo;
    console.log(`處理訂單 ${orderId} 的支付通知，交易編號: ${merchantTradeNo}`);

    // 7. 检查订单是否已处理
    if (order.status === orderEnum.PAID) {
      console.log("訂單已支付，忽略重複通知:", orderId);
      return new Response("1|OK", {
        status: 200,
      });
    }

    // 8. 更新订单状态
    if (isPaymentSuccess) {
      // 解析订单支付细节
      let paymentDetails;
      try {
        paymentDetails = JSON.parse(order.paymentDetails || "{}");
      } catch (error) {
        console.error("解析訂單支付細節出錯:", error);
        return new Response("0|Invalid Payment Details", {
          status: 400,
        });
      }

      const { planId, lensViewId } = paymentDetails;

      if (!planId) {
        console.error("訂單支付細節缺少計劃 ID");
        return new Response("0|Missing Plan ID in Payment Details", {
          status: 400,
        });
      }

      // 9. 查询订阅计划
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        console.error("未找到訂閱計劃:", planId);
        return new Response("0|Subscription Plan Not Found", {
          status: 404,
        });
      }

      // 10. 更新订单状态为已支付
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: orderEnum.PAID,
          paymentDetails: JSON.stringify({
            ...paymentDetails,
            ecpayResponse: callbackData,
          }),
        },
      });

      // 11. 计算订阅结束日期
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // 12. 创建订阅记录
      await prisma.subscription.create({
        data: {
          userId: order.userId,
          planId,
          lensViewId: lensViewId || plan.lensViewId,
          startDate,
          endDate,
          status: subscriptionEnum.ACTIVE,
          autoRenew: false, // 根据需求不处理自动续费
          orders: {
            connect: {
              id: orderId,
            },
          },
        },
      });

      console.log("支付成功，已創建訂閱，訂單 ID:", orderId);
    } else {
      // 支付失败
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: orderEnum.FAILED,
          paymentDetails: JSON.stringify({
            ...JSON.parse(order.paymentDetails || "{}"),
            ecpayResponse: callbackData,
          }),
        },
      });

      console.log("支付失败，訂單 ID:", orderId);
    }

    // 13. 返回 Ecpay 要求的响应格式
    return new Response("1|OK", {
      status: 200,
    });
  } catch (error) {
    console.error("處理 ECPay 支付通知時出錯:", error);

    return new Response("0|Error", {
      status: 500,
    });
  }
}

// 由於綠界可能也發送GET請求進行測試
export async function GET() {
  return new Response("1|OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
