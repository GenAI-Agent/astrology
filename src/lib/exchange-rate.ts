import axios from "axios";

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface CachedRates {
  timestamp: number;
  rates: Record<string, number>;
}

export class ExchangeRateService {
  private static cache: CachedRates | null = null;
  private static CACHE_DURATION = 3600000; // 1小時快取時間（毫秒）
  private apiKey: string;

  constructor() {
    // 使用環境變量獲取API Key
    this.apiKey = process.env.EXCHANGERATE_API_KEY || "";

    if (!this.apiKey) {
      console.warn("匯率API金鑰未設置，將使用模擬數據");
    }
  }

  // 獲取 USD 到 TWD 的匯率
  async getUSDToTWDRate(): Promise<number> {
    try {
      // 檢查快取是否有效
      if (
        ExchangeRateService.cache &&
        Date.now() - ExchangeRateService.cache.timestamp <
          ExchangeRateService.CACHE_DURATION &&
        ExchangeRateService.cache.rates["TWD"]
      ) {
        return ExchangeRateService.cache.rates["TWD"];
      }

      if (!this.apiKey) {
        // 如果沒有API金鑰，使用預設匯率
        return 30;
      }

      // 呼叫 exchangerate-api 獲取最新匯率
      const response = await axios.get<ExchangeRateResponse>(
        `https://v6.exchangerate-api.com/v6/${this.apiKey}/latest/USD`
      );

      if (response.data.result === "success") {
        // 更新快取
        ExchangeRateService.cache = {
          timestamp: Date.now(),
          rates: response.data.conversion_rates,
        };

        return response.data.conversion_rates["TWD"];
      } else {
        throw new Error("獲取匯率失敗");
      }
    } catch (error) {
      console.error("獲取匯率時出錯:", error);
      // 出錯時返回預設匯率
      return 30;
    }
  }

  // 使用匯率轉換幣值
  async convertUSDToTWD(amountUSD: number): Promise<number> {
    const rate = await this.getUSDToTWDRate();
    return Math.round(amountUSD * rate); // 四捨五入到整數
  }
}
