# Trading Agent Backend

這是一個使用 Quart 和 LangGraph 建立的交易代理後端服務。

## 功能特點

- 基於 LangGraph 的 ReactAgent 實現
- 支援 Server-Sent Events (SSE) 串流回應
- 整合多個交易相關工具（位置、靜態數據、動態數據、股票數據）
- 支援多個交易策略人格設定

## 安裝步驟

1. 確保已安裝 Python 3.8+ 和 uv

2. 啟動虛擬環境並安裝依賴：
```bash
source .venv/bin/activate
uv pip install -r requirements.txt
```

3. 設定環境變數：
```bash
cp .env.example .env
# 編輯 .env 檔案，填入您的 Azure OpenAI 設定
```

## 啟動服務

```bash
# 使用啟動腳本
./run_server.sh

# 或直接執行
source .venv/bin/activate
python quart_server.py
```

服務將在 http://localhost:8000 啟動

## API 端點

### 1. 健康檢查
```
GET /health
```

### 2. 交易分析（SSE 串流）
```
POST /vi_trader
Content-Type: application/json

{
    "query": "您的問題",
    "context": {
        "strategy_id": "tech_growth"  // 或 "value_dividend"
    },
    "locale": "tw",
    "user_id": "user_123"
}
```

### 3. 停止生成
```
POST /stop_generation
Content-Type: application/json

{
    "user_id": "user_123"
}
```

### 4. 查看活躍生成任務
```
GET /active_generations
```

## 測試

執行測試腳本：
```bash
source .venv/bin/activate
python test_server.py
```

## 工具說明

系統包含以下模擬工具：

- `get_positions`: 獲取當前持倉
- `get_static_data`: 獲取靜態市場數據（報告、財報、IPO等）
- `get_dynamic_data`: 獲取動態市場數據（指數、漲跌、技術分析等）
- `get_ticker_data`: 獲取特定股票數據（營收、新聞、基本面）

## 交易策略

目前支援兩種交易策略人格：

1. **tech_growth**: 科技成長獵手 - 專精於科技股投資
2. **value_dividend**: 價值股息女王 - 偏好價值投資和高股息股票