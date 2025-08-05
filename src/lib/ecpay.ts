import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

export interface ECPayOrder {
  MerchantTradeNo: string; // 訂單編號
  MerchantTradeDate: string; // 訂單日期
  TotalAmount: number; // 金額
  TradeDesc: string; // 交易描述
  ItemName: string; // 商品名稱（多筆商品請以 # 分隔）
  ReturnURL: string; // 後端接收支付結果通知網址
  ClientBackURL?: string; // 支付完成後導回商店網址
  OrderResultURL?: string; // 支付完成後顯示結果網址
  ChoosePayment?: string; // 付款方式 (預設 ALL)
  EncryptType?: string | number; // 加密類型 (預設 1，使用SHA256)
  StoreID?: string; // 特店旗下店舖代號
  ItemURL?: string; // 商品銷售網址
  Remark?: string; // 備註欄位
  ChooseSubPayment?: string; // 付款子項目
  NeedExtraPaidInfo?: string; // 是否需要額外的付款資訊 (預設 N)
  IgnorePayment?: string; // 隱藏付款方式 (以 # 分隔)
  PlatformID?: string; // 特約合作平台商代號
  CustomField1?: string; // 自訂名稱欄位1
  CustomField2?: string; // 自訂名稱欄位2
  CustomField3?: string; // 自訂名稱欄位3
  CustomField4?: string; // 自訂名稱欄位4
  Language?: string; // 語系設定
}
export class ECPayService {
  private merchantID: string;
  private hashKey: string;
  private hashIV: string;
  private apiUrl: string;

  constructor() {
    this.merchantID = process.env.ECPAY_MERCHANT_ID || "";
    this.hashKey = process.env.ECPAY_HASH_KEY || "";
    this.hashIV = process.env.ECPAY_HASH_IV || "";
    this.apiUrl = process.env.ECPAY_API_URL || "";

    // 检查是否有任何配置参数为空，但不抛出错误，只打印警告
    if (!this.merchantID || !this.hashKey || !this.hashIV || !this.apiUrl) {
      console.warn("警告: ECPay 环境变量未完全设置，使用了默认测试值");
    }
  }

  /**
   * 生成訂單編號 (自訂，每次不重複)
   */
  generateMerchantTradeNo(): string {
    // 使用 uuid 前6位作為基礎，再加上時間戳記的後8位，確保總長度不超過20字元
    const uuid = uuidv4().split("-")[0].substring(0, 6);
    const timestamp = Date.now().toString().slice(-8);
    return `${uuid}${timestamp}`;
  }

  /**
   * 生成目前的訂單時間，格式: yyyy/MM/dd HH:mm:ss
   */
  generateMerchantTradeDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 生成 CheckMacValue (用於驗證交易資料正確性)
   */
  generateCheckMacValue(order: Record<string, any>): string {
    // 1. 將資料按照參數名稱的字母順序排序
    const sortedKeys = Object.keys(order).sort();

    // 2. 組成 key1=value1&key2=value2 的字串
    let queryString = sortedKeys.map((key) => `${key}=${order[key]}`).join("&");

    // 3. 在最前面加上 HashKey，最後面加上 HashIV
    queryString = `HashKey=${this.hashKey}&${queryString}&HashIV=${this.hashIV}`;

    // 4. 進行 URL encode
    queryString = encodeURIComponent(queryString).toLowerCase();

    // 5. 將特殊字符做替換，符合綠界規範
    queryString = queryString
      .replace(/%20/g, "+")
      .replace(/%2d/g, "-")
      .replace(/%5f/g, "_")
      .replace(/%2e/g, ".")
      .replace(/%21/g, "!")
      .replace(/%2a/g, "*")
      .replace(/%28/g, "(")
      .replace(/%29/g, ")")
      .replace(/%3c/g, "<")
      .replace(/%3e/g, ">");

    // 6. 使用 SHA256 加密，再轉為大寫
    const hash = CryptoJS.SHA256(queryString).toString().toUpperCase();

    return hash;
  }

  /**
   * 建立訂單並取得付款表單資料
   */
  createPaymentForm(orderData: Partial<ECPayOrder>): {
    apiUrl: string;
    formData: Record<string, any>;
  } {
    // 設定必要的訂單資料
    const order: Record<string, any> = {
      MerchantID: this.merchantID,
      MerchantTradeNo:
        orderData.MerchantTradeNo || this.generateMerchantTradeNo(),
      MerchantTradeDate:
        orderData.MerchantTradeDate || this.generateMerchantTradeDate(),
      PaymentType: "aio", // 固定填入 aio
      TotalAmount: orderData.TotalAmount?.toString(), // 確保為字符串
      // 確保 TradeDesc 不為空，且使用更寬鬆的字元過濾方式
      TradeDesc: (orderData.TradeDesc || "商品描述").trim() || "商品描述",
      ItemName: orderData.ItemName,
      ReturnURL: orderData.ReturnURL,
      ChoosePayment: orderData.ChoosePayment || "ALL", // ALL表示顯示所有付款方式，讓使用者選擇
      EncryptType: orderData.EncryptType || 1, // 使用SHA256加密

      // 以下為可選參數，只有在有值時才加入
      ...(orderData.ClientBackURL && {
        ClientBackURL: orderData.ClientBackURL,
      }),
      ...(orderData.OrderResultURL && {
        OrderResultURL: orderData.OrderResultURL,
      }),
      ...(orderData.StoreID && {
        StoreID: orderData.StoreID,
      }),
      ...(orderData.ItemURL && {
        ItemURL: orderData.ItemURL,
      }),
      ...(orderData.Remark && {
        Remark: orderData.Remark,
      }),
      ...(orderData.ChooseSubPayment && {
        ChooseSubPayment: orderData.ChooseSubPayment,
      }),
      ...(orderData.NeedExtraPaidInfo && {
        NeedExtraPaidInfo: orderData.NeedExtraPaidInfo,
      }),
      ...(orderData.IgnorePayment && {
        IgnorePayment: orderData.IgnorePayment,
      }),
      ...(orderData.PlatformID && {
        PlatformID: orderData.PlatformID,
      }),
      ...(orderData.CustomField1 && {
        CustomField1: orderData.CustomField1,
      }),
      ...(orderData.CustomField2 && {
        CustomField2: orderData.CustomField2,
      }),
      ...(orderData.CustomField3 && {
        CustomField3: orderData.CustomField3,
      }),
      ...(orderData.CustomField4 && {
        CustomField4: orderData.CustomField4,
      }),
      ...(orderData.Language && {
        Language: orderData.Language,
      }),
    };

    // 檢查必填參數是否都已提供
    this.validateRequiredParams(order);

    // 計算檢查碼
    const checkMacValue = this.generateCheckMacValue(order);
    order.CheckMacValue = checkMacValue;

    return {
      apiUrl: this.apiUrl,
      formData: order,
    };
  }

  /**
   * 驗證必填參數是否都已提供
   */
  private validateRequiredParams(order: Record<string, any>): void {
    const requiredParams = [
      "MerchantID",
      "MerchantTradeNo",
      "MerchantTradeDate",
      "PaymentType",
      "TotalAmount",
      "TradeDesc",
      "ItemName",
      "ReturnURL",
      "ChoosePayment",
      "EncryptType",
    ];

    const missingParams = requiredParams.filter((param) => !order[param]);
    if (missingParams.length > 0) {
      throw new Error(`缺少必填參數: ${missingParams.join(", ")}`);
    }
  }

  /**
   * 驗證 ECPay 的回傳資料
   */
  verifyCallback(callbackData: Record<string, any>): boolean {
    // 取出檢查碼
    const checkMacValue = callbackData.CheckMacValue;

    // 建立新的物件，移除 CheckMacValue
    const { CheckMacValue, ...data } = callbackData;

    // 重新計算檢查碼
    const calculatedCheckMacValue = this.generateCheckMacValue(data);

    // 比對檢查碼是否一致
    return checkMacValue === calculatedCheckMacValue;
  }
}
