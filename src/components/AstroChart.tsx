'use client';

import { useEffect, useState } from 'react';

interface AstroChartProps {
  width?: number;  // Chart width in pixels (default: 400)
  height?: number; // Chart height in pixels (default: 400)
  data: {         // Astrological data - if not provided, uses defaultData
    planets: Record<string, number[]>;  // Planet positions in degrees
    cusps: number[];                   // 12 house cusps in degrees
  };
  // Advanced features
  showAspects?: boolean;     // Show aspects lines (default: false)
  customAspects?: any[];     // Custom aspects array (FormedAspect[])
  transitData?: {            // Transit data for overlaying current positions
    planets: Record<string, number[]>;
    cusps: number[];
  };
  className?: string; // Additional CSS classes
  id: string;         // Unique ID for the chart container (required)
}

/* 
使用範例 / Usage Examples:

1. 基本星盤 / Basic chart:
<AstroChart id="my-chart" />

2. 自定義資料 / Custom data:
const myData = {
  planets: { "Sun": [120], "Moon": [45] },
  cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
};
<AstroChart id="my-chart" data={myData} />

3. 顯示相位 / Show aspects:
<AstroChart id="my-chart" showAspects={true} />

4. 自定義相位 / Custom aspects:
const myAspects = [
  // FormedAspect[] - 你的相位資料
];
<AstroChart id="my-chart" customAspects={myAspects} />

5. 行運圖 / Transit chart:
const currentTransits = {
  planets: { "Sun": [90], "Moon": [180] },
  cusps: [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345]
};
<AstroChart 
  id="my-chart" 
  data={birthChart} 
  transitData={currentTransits} 
  showAspects={true} 
/>
*/

export default function AstroChart({
  width = 400,
  height = 400,
  data,
  showAspects = false,
  customAspects,
  transitData,
  className = "",
  id
}: AstroChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize astrochart - 基於成功的簡單實作
  useEffect(() => {
    if (mounted && !chartLoaded && typeof window !== 'undefined') {
      const initChart = async () => {
        try {
          const { Chart } = await import('@astrodraw/astrochart');

          // 設定顏色 - 必須在創建Chart時傳入
          const customSettings = {
            // 使用COLORS_SIGNS陣列設定12個星座顏色（按順序）
            COLORS_SIGNS: [
              '#FF6B6B', // Aries - 活力紅
              '#4ECDC4', // Taurus - 大地青
              '#FFD93D', // Gemini - 智慧黃
              '#6BCB77', // Cancer - 療癒綠
              '#FFB319', // Leo - 太陽橙
              '#95E1D3', // Virgo - 純淨薄荷
              '#C7CEEA', // Libra - 平衡紫
              '#B983FF', // Scorpio - 神秘紫
              '#FD7272', // Sagittarius - 冒險紅
              '#686D76', // Capricorn - 穩重灰
              '#45B7D1', // Aquarius - 創新藍
              '#A8E6CF'  // Pisces - 夢幻綠
            ],
            // 其他顏色設定
            SIGNS_COLOR: '#1a1a1a',        // 星座符號文字顏色 - 深灰
            POINTS_COLOR: 'rgba(255, 255, 255, 0.8)',       // 行星符號顏色 - 中灰
            CIRCLE_COLOR: 'rgba(255, 255, 255, 0.8)', // 圓圈線條顏色 - 半透明白
            LINE_COLOR: 'rgba(255, 255, 255, 0.5)',  // 線條顏色 - 更淡的白
            CUSPS_FONT_COLOR: 'rgba(255, 255, 255, 0.8)',   // 宮位數字顏色 - 柔和灰
            SYMBOL_AXIS_FONT_COLOR: 'rgba(255, 255, 255, 0.9)', // MC/IC/AS/DS 顏色 - 亮白
            SYMBOL_AXIS_STROKE: 2,          // 軸點符號粗細
            COLOR_BACKGROUND: 'transparent', // 背景透明
            // 相位線顏色
            ASPECTS: {
              conjunction: { degree: 0, orbit: 10, color: '#FFE66D' },    // 合相 - 明亮金黃
              square: { degree: 90, orbit: 8, color: '#FF4757' },        // 刑相 - 鮮豔紅色
              trine: { degree: 120, orbit: 8, color: '#2ED573' },        // 拱相 - 翠綠色
              opposition: { degree: 180, orbit: 10, color: '#A55EEA' },  // 對相 - 亮紫色
              sextile: { degree: 60, orbit: 6, color: '#54A0FF' },       // 六合 - 天藍色
              quincunx: { degree: 150, orbit: 3, color: '#FFA502' },     // 梅花相 - 亮橙色
              semisquare: { degree: 45, orbit: 3, color: '#FF6B9D' },    // 半刑 - 粉紅色
              sesquiquadrate: { degree: 135, orbit: 3, color: '#C44569' } // 補八分相 - 深粉色
            },
            // 相位線設定
            STROKE_ONLY: false,              // 設為 false 讓每個相位使用自己的顏色
            CUSPS_STROKE: 2,                // 相位線粗細
            SYMBOL_SCALE: 1                  // 符號縮放比例
          };

          // 完全按照成功版本的方式：創建Chart時傳入設定
          const chart = new Chart(id, width, height, customSettings);

          // Draw the radix chart
          const radix = chart.radix(data);

          // Add aspects if requested
          if (showAspects) {
            if (customAspects) {
              // Use custom aspects
              radix.aspects(customAspects);
            } else {
              // Let AstroChart calculate aspects automatically
              radix.aspects();
            }
          }

          // Add transit data if provided
          if (transitData) {
            radix.transit(transitData);
          }

          setChartLoaded(true);
        } catch (error) {
          console.error('Error loading chart:', error);
        }
      };

      // 和成功版本一樣的延遲
      setTimeout(initChart, 100);
    }
  }, [mounted, chartLoaded, id, width, height, data, showAspects, customAspects, transitData]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        id={id}
        className="w-full max-w-lg"
        style={{ minHeight: `${height}px` }}
      >
        {mounted && !chartLoaded && (
          <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
            Loading astrological chart...
          </div>
        )}
      </div>
    </div>
  );
}