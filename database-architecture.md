# Astrology App Database Architecture

## 概述

從 MongoDB 遷移到 PostgreSQL 的資料庫設計，保持彈性同時利用關聯式資料庫的優勢。

## 主要資料表設計

### 1. astro_users 表

```sql
CREATE TABLE astro_users (
  id VARCHAR(255) PRIMARY KEY, -- 直接使用認證系統的用戶ID作為主鍵
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_location VARCHAR(255) NOT NULL, -- 可考慮分拆為 city, country
  latitude DECIMAL(10, 8), -- 精確地理位置
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  today_divination JSONB, -- 今日占卜結果
  divination_date DATE, -- 占卜結果的日期
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_astro_users_divination_date (divination_date)
);
```

**考慮點：**

- `today_divination` 使用 JSONB 格式，支援複雜的占卜結果結構
- 地理位置分為人類可讀的 `birth_location` 和精確的經緯度
- `divination_date` 單獨存放，方便查詢是否需要更新今日占卜

### 2. chat_sessions 表

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_chat_sessions_user_id (user_id),
  INDEX idx_chat_sessions_session_id (session_id),
  INDEX idx_chat_sessions_created_at (created_at)
);
```

### 3. chat_messages 表

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('human', 'ai')),
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'tool_use', 'tool_result', 'choose_agent')),
  content TEXT NOT NULL,

  -- 工具相關欄位
  tool_id VARCHAR(255),
  tool_name VARCHAR(255),
  tool_args JSONB,
  tool_result TEXT,

  -- 文本訊息相關欄位
  sources JSONB,
  prompts JSONB,

  -- 評分及優化欄位
  score INTEGER CHECK (score >= 0 AND score <= 100), -- 0-100分評分
  note TEXT, -- 優化筆記

  message_order INTEGER NOT NULL, -- 訊息在會話中的順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  INDEX idx_chat_messages_session_id (session_id),
  INDEX idx_chat_messages_created_at (created_at),
  INDEX idx_chat_messages_order (session_id, message_order)
);
```

## 設計考量

### 優點

1. **型別安全**: 使用 CHECK 約束確保資料完整性
2. **查詢效率**: 適當的索引設計
3. **彈性**: JSONB 欄位保持複雜資料結構的彈性
4. **關聯性**: 利用外鍵維護資料一致性

### 替代方案討論

#### 方案 A: 單表 + 大 JSON (目前建議)

**優點**: 簡單，接近原本 MongoDB 結構
**缺點**: 查詢特定訊息類型時效率較低

#### 方案 B: 完全正規化

```sql
-- 每種訊息類型都有專門的表
CREATE TABLE text_messages (...);
CREATE TABLE tool_use_messages (...);
CREATE TABLE tool_result_messages (...);
```

**優點**: 最佳查詢效能，型別安全
**缺點**: 複雜度高，需要大量 JOIN

#### 方案 C: 混合式 (推薦考慮)

保持目前的設計，但將常查詢的欄位提取出來，複雜資料用 JSONB 存放。

## 資料範例

### astro_users 範例

```json
{
  "user_id": "user123",
  "birth_date": "1990-05-15",
  "birth_time": "14:30:00",
  "birth_location": "台北市, 台灣",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "today_divination": {
    "date": "2024-01-15",
    "fortune": "吉",
    "lucky_color": "藍色",
    "lucky_number": 7,
    "advice": "今日適合...",
    "detailed_reading": {...}
  }
}
```

### chat_messages 範例

#### 文本訊息範例

```json
{
  "session_id": "sess123",
  "role": "human",
  "message_type": "text",
  "content": "幫我看看今天的運勢如何？",
  "score": 80,
  "note": "用戶詢問清楚，但可以更具體說明想了解的方面",
  "message_order": 1
}
```

#### 工具使用訊息範例

```json
{
  "session_id": "sess123",
  "role": "ai",
  "message_type": "tool_use",
  "content": "我來為你查詢星座運勢",
  "tool_id": "tool456",
  "tool_name": "astrology_reading",
  "tool_args": {
    "birth_date": "1990-05-15",
    "query_type": "daily"
  },
  "score": 95,
  "note": "工具調用正確，參數完整",
  "message_order": 2
}
```

#### 工具結果訊息範例

```json
{
  "session_id": "sess123",
  "role": "ai",
  "message_type": "tool_result",
  "content": "根據你的星座分析...",
  "tool_id": "tool456",
  "tool_name": "astrology_reading",
  "tool_result": "今日運勢：良好。建議穿著藍色衣物...",
  "score": 65,
  "note": "回答內容準確但缺乏個人化建議，可以更具體",
  "message_order": 3
}
```

## 遷移策略

1. 建立新的 schema
2. 建立資料轉換腳本
3. 批次匯入現有資料
4. 更新應用程式程式碼
5. 測試並驗證

## 評分系統說明

每個訊息都有評分和筆記欄位：

- **score**: 0-100 分評分系統
  - 0-20 分：回答錯誤或無關
  - 21-40 分：回答部分正確但有明顯問題
  - 41-60 分：回答正確但不夠詳細
  - 61-80 分：回答良好，內容豐富
  - 81-100 分：回答完美，個人化且有用
- **note**: 優化筆記，記錄改進建議

## 已解決問題

1. ✅ `birth_location` 不需要分拆為更細的欄位
2. ✅ `today_divination` 的結構符合需求
3. ✅ 不需要保存歷史占卜記錄
4. ✅ 訊息表設計已提供完整範例
