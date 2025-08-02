# -*- coding: utf-8 -*-
# Mock tools for the ReactAgent
from typing import Dict, Any, List
from langchain_core.tools import tool
import random
import json
from datetime import datetime, timedelta

@tool
def get_positions() -> Dict[str, Any]:
    """Get current trading positions"""
    return {
        "positions": [
            {
                "symbol": "AAPL",
                "shares": 100,
                "avg_cost": 150.00,
                "current_price": 155.50,
                "pnl": 550.00,
                "pnl_percent": 3.67
            },
            {
                "symbol": "GOOGL", 
                "shares": 50,
                "avg_cost": 2800.00,
                "current_price": 2850.00,
                "pnl": 2500.00,
                "pnl_percent": 1.79
            }
        ],
        "total_value": 158050.00,
        "total_pnl": 3050.00,
        "total_pnl_percent": 1.97
    }

@tool
def get_static_data(item_name: str) -> Dict[str, Any]:
    """Get static market data by item name
    
    Args:
        item_name: Name of the static data item to retrieve
        
    Supported items:
        - llm_report: LLM analysis report
        - llm_report_audio: Audio report URL
        - earning_season: Earnings season data
        - market_sectors: Market sectors data
        - ipo_calendar: IPO calendar
        - global_events: Global economic events
        - insider_trading_rss: Insider trading RSS
        - senate_trading_rss: Senate trading RSS
    """
    static_data_map = {
        "llm_report": {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "title": "Daily Market Analysis",
            "summary": "Markets showed mixed signals today with tech stocks leading gains...",
            "key_points": [
                "Tech sector up 2.5%",
                "Energy sector down 1.2%", 
                "Fed comments boosted sentiment"
            ]
        },
        "llm_report_audio": {
            "url": "https://example.com/audio/daily-report.mp3",
            "duration": "5:32",
            "created_at": datetime.now().isoformat()
        },
        "earning_season": {
            "current_quarter": "Q4 2023",
            "upcoming_earnings": [
                {"symbol": "MSFT", "date": "2024-01-24", "estimate": 2.65},
                {"symbol": "TSLA", "date": "2024-01-25", "estimate": 0.73}
            ]
        },
        "market_sectors": {
            "sectors": [
                {"name": "Technology", "change_percent": 2.5, "top_gainer": "NVDA"},
                {"name": "Healthcare", "change_percent": 0.8, "top_gainer": "UNH"},
                {"name": "Energy", "change_percent": -1.2, "top_loser": "XOM"}
            ]
        },
        "ipo_calendar": {
            "upcoming_ipos": [
                {"symbol": "XYZ", "date": "2024-02-01", "price_range": "18-22"},
                {"symbol": "ABC", "date": "2024-02-05", "price_range": "25-30"}
            ]
        },
        "global_events": {
            "events": [
                {"date": "2024-01-31", "event": "Fed Rate Decision", "impact": "High"},
                {"date": "2024-02-02", "event": "NFP Report", "impact": "High"}
            ]
        },
        "insider_trading_rss": {
            "trades": [
                {"insider": "John Doe", "company": "AAPL", "action": "Buy", "shares": 10000},
                {"insider": "Jane Smith", "company": "GOOGL", "action": "Sell", "shares": 5000}
            ]
        },
        "senate_trading_rss": {
            "trades": [
                {"senator": "Senator X", "ticker": "MSFT", "action": "Buy", "amount": "$50K-$100K"},
                {"senator": "Senator Y", "ticker": "AMZN", "action": "Sell", "amount": "$15K-$50K"}
            ]
        }
    }
    
    return static_data_map.get(item_name, {"error": f"Unknown item: {item_name}"})

@tool 
def get_dynamic_data(item_name: str) -> Dict[str, Any]:
    """Get dynamic market data by item name
    
    Args:
        item_name: Name of the dynamic data item to retrieve
        
    Supported items:
        - watchlist_data: Watchlist data
        - major_indices: Major indices data
        - market_movers: Market movers
        - extreme_stocks: Extreme stock movements
        - technical_analysis: Technical analysis
        - vix_history: VIX history
        - macroeconomic_indicators: Macro indicators
        - general_news: General market news
    """
    dynamic_data_map = {
        "watchlist_data": {
            "watchlist": [
                {"symbol": "AAPL", "price": 155.50, "change": 2.3, "volume": 45000000},
                {"symbol": "GOOGL", "price": 2850.00, "change": 1.5, "volume": 25000000},
                {"symbol": "MSFT", "price": 380.25, "change": -0.5, "volume": 30000000}
            ]
        },
        "major_indices": {
            "indices": [
                {"name": "S&P 500", "value": 4800.50, "change": 0.8},
                {"name": "Nasdaq", "value": 15200.75, "change": 1.2},
                {"name": "Dow Jones", "value": 37500.25, "change": 0.5}
            ]
        },
        "market_movers": {
            "gainers": [
                {"symbol": "NVDA", "change_percent": 5.2},
                {"symbol": "AMD", "change_percent": 4.8}
            ],
            "losers": [
                {"symbol": "BA", "change_percent": -3.2},
                {"symbol": "DIS", "change_percent": -2.8}
            ]
        },
        "extreme_stocks": {
            "overbought": ["NVDA", "AMD", "TSLA"],
            "oversold": ["BA", "DIS", "NKE"]
        },
        "technical_analysis": {
            "signals": [
                {"symbol": "AAPL", "signal": "Buy", "indicator": "RSI oversold"},
                {"symbol": "GOOGL", "signal": "Hold", "indicator": "Moving average support"}
            ]
        },
        "vix_history": {
            "current": 15.2,
            "1d_ago": 14.8,
            "1w_ago": 16.5,
            "1m_ago": 18.2
        },
        "macroeconomic_indicators": {
            "gdp_growth": 2.1,
            "inflation": 3.2,
            "unemployment": 3.7,
            "interest_rate": 5.5
        },
        "general_news": {
            "headlines": [
                "Fed signals potential rate cuts in 2024",
                "Tech earnings beat expectations",
                "Oil prices rise on supply concerns"
            ]
        }
    }
    
    return dynamic_data_map.get(item_name, {"error": f"Unknown item: {item_name}"})

@tool
def get_ticker_data(ticker: str, item_name: str) -> Dict[str, Any]:
    """Get specific ticker data
    
    Args:
        ticker: Stock ticker symbol
        item_name: Type of data to retrieve
        
    Supported items:
        - sales_revenue_segments: Revenue breakdown
        - stock_news: Stock-specific news
        - stock_fundamentals: Fundamental data
    """
    ticker_data_map = {
        "sales_revenue_segments": {
            "ticker": ticker,
            "segments": [
                {"name": "Product Sales", "revenue": 250000000, "percent": 60},
                {"name": "Services", "revenue": 150000000, "percent": 36},
                {"name": "Other", "revenue": 16666667, "percent": 4}
            ]
        },
        "stock_news": {
            "ticker": ticker,
            "news": [
                {
                    "title": f"{ticker} announces new product launch",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "sentiment": "positive"
                },
                {
                    "title": f"Analysts upgrade {ticker} price target",
                    "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "sentiment": "positive"
                }
            ]
        },
        "stock_fundamentals": {
            "ticker": ticker,
            "pe_ratio": 25.5,
            "market_cap": 2500000000000,
            "dividend_yield": 0.5,
            "eps": 6.12,
            "revenue_growth": 15.2,
            "profit_margin": 25.8
        }
    }
    
    return ticker_data_map.get(item_name, {"error": f"Unknown item: {item_name}"})