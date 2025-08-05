/**
 * 從 HTML 字符串中提取純文本並限制行數
 * @param html HTML 字符串
 * @param maxLines 最大行數
 * @returns 處理後的純文本
 */
export const extractTextFromHtml = (html: string | undefined, maxLines = 8) => {
  if (!html) return "";

  // 移除 HTML 標籤
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";

  // 按行分割並限制行數
  return text.split("\n").slice(0, maxLines).join("\n");
};

/**
 * 處理內容，將 [1]、[2] 等格式轉換為 Markdown 連結
 * @param content 原始內容
 * @param sources 來源資料
 * @returns 處理後的內容
 */
export const processContent = (content: string, sources?: any[]): string => {
  if (!sources || sources.length === 0) return content;
  // 使用正則表達式尋找 [1]、[2] 以及【1】、【2】等的格式
  return content.replace(/[\[【](\d+)[\]】]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1; // 轉換成 0-index 編號
    const source = sources[index];
    if (!source) {
      return match; // 如果沒有 source，返回原始匹配
    }

    // 使用標準的 Markdown 鏈接格式，但使用特殊的 href 值
    return `[${p1}](${source})`;
  });
};

/**
 * 將數字轉換為中文數字表示
 * @param num 要轉換的數字
 * @returns 中文數字表示
 */
export function convertToChineseNumber(num: number): string {
  const chineseNumbers = [
    "零",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
  ];

  if (num <= 10) {
    return chineseNumbers[num];
  } else if (num < 20) {
    return `十${num > 10 ? chineseNumbers[num - 10] : ""}`;
  } else if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${chineseNumbers[tens]}十${ones > 0 ? chineseNumbers[ones] : ""}`;
  }

  // 如果數字大於等於 100，返回原始數字
  return num.toString();
}
