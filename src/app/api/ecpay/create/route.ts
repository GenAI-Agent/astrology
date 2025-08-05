import { NextRequest, NextResponse } from "next/server";
import { ECPayService } from "@/lib/ecpay";

export async function POST(request: NextRequest) {
  try {
    // 從請求中獲取訂單數據
    const orderData = await request.json();
    console.log("接收到的訂單數據:", orderData);

    // 檢查 TradeDesc 是否存在
    if (!orderData.TradeDesc) {
      console.warn("警告: 接收到的 TradeDesc 為空，將使用默認值");
      orderData.TradeDesc = "商品描述";
    }

    // 創建ECPay服務實例
    const ecpayService = new ECPayService();

    // 生成付款表單數據
    const { apiUrl, formData } = ecpayService.createPaymentForm(orderData);
    console.log("生成的表單數據:", {
      apiUrl,
      formData: {
        ...formData,
        TradeDesc: formData.TradeDesc, // 記錄生成的 TradeDesc
        CheckMacValue: formData.CheckMacValue ? "已生成" : "未生成",
      },
    });

    // 返回表單數據
    return NextResponse.json({ success: true, apiUrl, formData });
  } catch (error) {
    console.error("處理ECPay訂單創建時出錯:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 },
    );
  }
}
