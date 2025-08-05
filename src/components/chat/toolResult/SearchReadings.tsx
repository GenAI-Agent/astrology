import React, { useState } from 'react';
import { FileText, Target, ChevronDown, ChevronRight } from "lucide-react";

interface ReadingSearchResult {
  reading_title: string;
  chunk_text: string;
  chunk_type: string;
  line_idx: number;
  distance: number;
}

interface SearchReadingsProps {
  results: string | object | ReadingSearchResult[];
}

const SearchReadings: React.FC<SearchReadingsProps> = ({ results }) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  let readings: ReadingSearchResult[] = [];

  // 處理不同格式的輸入數據
  if (typeof results === "string") {
    try {
      const parsedResults = JSON.parse(results);
      readings = Array.isArray(parsedResults) ? parsedResults : [];
    } catch (error) {
      console.error("解析JSON字符串失敗:", error);
      readings = [];
    }
  } else if (Array.isArray(results)) {
    readings = results;
  } else if (typeof results === "object" && results !== null) {
    // 如果是對象，嘗試提取數組
    if ('results' in results && Array.isArray((results as any).results)) {
      readings = (results as any).results;
    } else if (Array.isArray(Object.values(results)[0])) {
      readings = Object.values(results)[0] as ReadingSearchResult[];
    } else {
      console.error("無法從對象中提取占星解讀結果數組");
      readings = [];
    }
  }

  // 取得解讀類型標籤
  const getChunkTypeLabel = (type: string) => {
    switch (type) {
      case 'interpretation':
        return '占星解讀';
      case 'summary':
        return '解讀摘要';
      case 'analysis':
        return '深度分析';
      case 'prediction':
        return '預測內容';
      case 'advice':
        return '建議指導';
      default:
        return type;
    }
  };

  // 取得類型顏色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'interpretation':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'summary':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'analysis':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'prediction':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'advice':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 計算相似度百分比
  const getSimilarityPercentage = (distance: number) => {
    return Math.round((1 - distance) * 100);
  };

  // 切換卡片展開狀態
  const toggleCardExpansion = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  // 格式化解讀標題，提取關鍵信息
  const formatReadingTitle = (title: string) => {
    // 這裡可以添加格式化邏輯來提取星座、行星等信息
    return title;
  };

  // 如果沒有有效數據，顯示錯誤信息
  if (!readings) {
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

  if (readings.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">🔍</div>
          <h3 className="text-base font-semibold text-foreground mb-2">未找到相關解讀</h3>
          <p className="text-muted-foreground text-sm">
            沒有找到相關的占星解讀內容，請嘗試使用其他關鍵詞進行搜索。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 custom-scrollbar">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">🔮 占星解讀檢索結果</h2>
        <p className="text-muted-foreground text-sm">找到 <span className="font-semibold text-primary">{readings.length}</span> 筆相關解讀</p>
      </div>

      {readings.map((result, index) => {
        const isExpanded = expandedCards.has(index);
        const similarity = getSimilarityPercentage(result.distance);
        const typeColorClass = getTypeColor(result.chunk_type);
        
        return (
          <div key={index} className="bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200">
            {/* 卡片標題 */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {formatReadingTitle(result.reading_title)}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${typeColorClass}`}>
                      <FileText className="w-3 h-3 inline mr-1" />
                      {getChunkTypeLabel(result.chunk_type)}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      <Target className="w-3 h-3 inline mr-1" />
                      相似度 {similarity}%
                    </span>
                  </div>
                </div>
                
                <div className="text-right text-xs text-muted-foreground ml-4">
                  <div className="font-medium">#{index + 1}</div>
                  <div>行 {result.line_idx}</div>
                </div>
              </div>
            </div>

            {/* 解讀內容預覽 */}
            <div className="p-4">
              <div className={`text-sm text-foreground ${isExpanded ? '' : 'line-clamp-3'} mb-3`}>
                {result.chunk_text}
              </div>
              
              <button
                onClick={() => toggleCardExpansion(index)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    收起內容
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    展開完整內容
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}

      {/* 底部統計 */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">
            共檢索到 <span className="font-bold text-primary">{readings.length}</span> 筆相關解讀，
            平均相似度為 <span className="font-bold text-chart-2">
              {Math.round(readings.reduce((acc, r) => acc + getSimilarityPercentage(r.distance), 0) / readings.length)}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchReadings;