import React, { useState } from 'react';
import AstroCard from '@/components/card/AstroCard';

interface AstroSearchResult {
  content: string;
  title: string;
  last_modified: string;
  astro_category: string;
  astro_name: string;
  astro_type: string;
  snippet: string;
  distance: number;
}

interface SearchAstroProps {
  results: string | object | AstroSearchResult[];
}

const SearchAstro: React.FC<SearchAstroProps> = ({ results }) => {
  let astroResults: AstroSearchResult[] = [];

  // 處理不同格式的輸入數據
  if (typeof results === "string") {
    try {
      const parsedResults = JSON.parse(results);
      astroResults = Array.isArray(parsedResults) ? parsedResults : [];
    } catch (error) {
      console.error("解析JSON字符串失敗:", error);
      astroResults = [];
    }
  } else if (Array.isArray(results)) {
    astroResults = results;
  } else if (typeof results === "object" && results !== null) {
    // 如果是對象，嘗試提取數組
    if ('results' in results && Array.isArray((results as any).results)) {
      astroResults = (results as any).results;
    } else if (Array.isArray(Object.values(results)[0])) {
      astroResults = Object.values(results)[0] as AstroSearchResult[];
    } else {
      console.error("無法從對象中提取占星結果數組");
      astroResults = [];
    }
  }

  // 計算相似度百分比
  const getSimilarityPercentage = (distance: number) => {
    return Math.round((1 - distance) * 100);
  };

  // 如果沒有有效數據，顯示錯誤信息
  if (!astroResults) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">⚠️</div>
          <h3 className="text-base font-semibold text-foreground mb-2">無法加載檢索結果</h3>
          <p className="text-muted-foreground text-sm">
            請檢查輸入的數據格式是否正確，或稍後再試。
          </p>
        </div>
      </div>
    );
  }
  if (astroResults.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">🔍</div>
          <h3 className="text-base font-semibold text-foreground mb-2">未找到相關占星資料</h3>
          <p className="text-muted-foreground text-sm">
            根據您的搜尋條件，目前沒有找到相關的占星內容。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 custom-scrollbar">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">⭐ 占星檢索結果</h2>
        <p className="text-muted-foreground text-sm">找到 <span className="font-semibold text-primary">{astroResults.length}</span> 筆相關資料</p>
      </div>

      {astroResults.map((result, index) => (
        <AstroCard key={index} result={result} index={index} />
      ))}

      {/* 底部統計 */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">
            共檢索到 <span className="font-bold text-primary">{astroResults.length}</span> 筆占星相關資料，
            平均相似度為 <span className="font-bold text-chart-2">
              {Math.round(astroResults.reduce((acc, r) => acc + getSimilarityPercentage(r.distance), 0) / astroResults.length)}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchAstro;