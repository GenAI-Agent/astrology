# -*- coding: utf-8 -*-
# system
from dotenv import load_dotenv
import sys
import os
import asyncio

# Agent
from typing import Annotated
from typing_extensions import TypedDict
from langchain_openai import AzureChatOpenAI
from langchain_core.caches import BaseCache
from langchain_core.callbacks import Callbacks

# Fix Pydantic model validation
AzureChatOpenAI.model_rebuild()
from langchain_core.messages import AnyMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

# 專案項目
# 獲取專案根目錄的路徑
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)
from tools import (
    get_positions,
    get_static_data,
    get_dynamic_data,
    get_ticker_data,
)

# 建立環境變數
load_dotenv()
api_base = os.environ["AZURE_OPENAI_ENDPOINT"] = (
    os.getenv("AZURE_OPENAI_ENDPOINT") or ""
)
api_key = os.environ["AZURE_OPENAI_API_KEY"] = os.getenv("AZURE_OPENAI_API_KEY") or ""


class AgentState(TypedDict):
    messages: Annotated[
        list[AnyMessage], add_messages
    ]  # 使用 add_messages 處理消息列表
    query: str


class TradingAgentGraph:
    def __init__(self):
        # 初始化 llm
        self.llm = AzureChatOpenAI(
            azure_endpoint=api_base,
            azure_deployment="gpt-4o-testing",
            api_version="2025-01-01-preview",
            temperature=0.6,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )

        # 初始化 graph
        self.tools = [get_positions, get_static_data, get_dynamic_data, get_ticker_data]
        self.tool_node = ToolNode(tools=self.tools)
        self.builder = StateGraph(AgentState)

        # 簡單的 graph 流程: START -> agent -> tools -> agent -> END
        self.builder.add_edge(START, "agent")
        self.builder.add_node("agent", self.agent_node)
        self.builder.add_node("tools", self.tool_node)

        # 定義路由函數
        def route_from_agent(state: dict) -> str:
            """根據 agent 的輸出決定下一步"""
            messages = state.get("messages", [])
            if not messages:
                return END

            last_message = messages[-1]
            # 檢查是否有工具調用
            if hasattr(last_message, "tool_calls") and last_message.tool_calls:
                return "tools"
            else:
                return END

        self.builder.add_conditional_edges(
            "agent",
            route_from_agent,
            {
                "tools": "tools",  # 需要調用工具
                END: END,  # 結束
            },
        )
        self.builder.add_edge("tools", "agent")
        self.graph = self.builder.compile()

    async def agent_node(self, state: dict) -> dict:
        """
        基本的 agent 節點，處理用戶查詢並決定是否使用工具
        """
        query = state.get("query", "")
        messages = state.get("messages", [])

        # 構建系統提示詞
        system_prompt = """你是一個交易分析助手。
        請根據用戶的問題分析並使用適當的工具獲取資料。
        
        可用工具：
        - get_positions: 獲取持倉資料
        - get_static_data: 獲取靜態數據
        - get_dynamic_data: 獲取動態數據  
        - get_ticker_data: 獲取股票數據
        
        如果需要工具協助，請調用相應工具。如果可以直接回答，請直接回覆用戶。
        """

        # 構建消息列表
        full_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]

        # 添加歷史消息
        if messages:
            for msg in messages:
                if (
                    hasattr(msg, "content")
                    and hasattr(msg, "type")
                    and msg.type != "system"
                ):
                    full_messages.append(msg)

        # 綁定工具到 LLM
        llm_with_tools = self.llm.bind_tools(self.tools)

        try:
            response = await llm_with_tools.ainvoke(full_messages)
            return {"messages": [response]}
        except Exception as e:
            error_msg = AIMessage(content=f"處理失敗: {str(e)}")
            return {"messages": [error_msg]}

    async def ainvoke(self, payload: dict):
        """
        調用 graph 處理請求
        """
        return await self.graph.ainvoke(payload)

    async def astream_run(self, payload: dict):
        """
        流式處理請求
        """
        async for result in self.graph.astream(payload):
            yield result


async def main():
    trading_agent = TradingAgentGraph()
    payload = {
        "query": "今天市場如何？",
        "messages": [],
    }
    result = await trading_agent.ainvoke(payload)
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
