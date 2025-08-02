# -*- coding: utf-8 -*-
import asyncio
import json
import time
from typing import Dict, Any
from quart import Quart, request, jsonify, Response
from quart_cors import cors
import logging
from agents.graph import TradingAgentGraph

# Initialize Quart app
app = Quart(__name__)
app = cors(app, allow_origin="*")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Active generations tracking
active_generations: Dict[str, str] = {}


class GenerationControl:
    """Control for stopping generation"""

    def __init__(self):
        self.stop_flags: Dict[str, bool] = {}

    def reset(self, request_id: str):
        """Reset stop flag for a request"""
        self.stop_flags[request_id] = False

    def stop(self, request_id: str):
        """Set stop flag for a request"""
        self.stop_flags[request_id] = True

    def check_stop(self, request_id: str) -> bool:
        """Check if generation should stop"""
        return self.stop_flags.get(request_id, False)

    def cleanup(self, request_id: str):
        """Clean up stop flag"""
        if request_id in self.stop_flags:
            del self.stop_flags[request_id]


generation_control = GenerationControl()


@app.route("/health", methods=["GET"])
async def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "trading-agent"})


@app.route("/vi_trader", methods=["POST"])
async def value_trader_zh():
    """API endpoint for trading agent"""
    try:
        data = await request.get_json()
        query = data.get("query")
        context = data.get("context", {})
        strategy_id = context.get("strategy_id")
        lang = data.get("locale", "tw")
        user_id = data.get("user_id")

        if not query:
            return {"error": "Please provide query"}, 400

        # Create TradingAgentGraph instance
        trading_agent = TradingAgentGraph()

        # Prepare payload matching the simplified graph.py usage
        payload = {
            "query": query,
            "messages": [],
        }

        request_id = str(user_id)
        active_generations[request_id] = "vi_trader"
        generation_control.reset(request_id)

        async def generate():
            try:
                heartbeat_interval = 25  # Send heartbeat every 25 seconds
                last_heartbeat = time.time()

                async for result in trading_agent.astream_run(payload):
                    if generation_control.check_stop(request_id):
                        break
                    
                    # Extract the final AI message content for streaming
                    try:
                        # Look for the final AI message in the result
                        for node_name, node_data in result.items():
                            if "messages" in node_data:
                                for msg in node_data["messages"]:
                                    if hasattr(msg, "content") and hasattr(msg, "type"):
                                        if msg.type == "ai" and msg.content:
                                            # Send the AI message content
                                            yield f"data: {json.dumps({'chunk': msg.content}, ensure_ascii=False)}\n\n"
                                            break
                    except Exception as e:
                        # If extraction fails, send a simple status update
                        yield f"data: {json.dumps({'status': f'Processing {node_name}...'}, ensure_ascii=False)}\n\n"

                    # Check if we need to send heartbeat
                    current_time = time.time()
                    if current_time - last_heartbeat > heartbeat_interval:
                        yield ": heartbeat\n\n"  # SSE comment line
                        last_heartbeat = current_time

                # Only remove request ID when generation completes normally
                if request_id in active_generations:
                    del active_generations[request_id]
            except Exception as e:
                yield f"data: {json.dumps({'error': f'Error generating response: {str(e)}'}, ensure_ascii=False)}\n\n"
            finally:
                # Clean up resources
                generation_control.cleanup(request_id)

        return Response(generate(), mimetype="text/event-stream")

    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500


@app.route("/stop_generation", methods=["POST"])
async def stop_generation():
    """Stop ongoing generation"""
    try:
        data = await request.get_json()
        user_id = data.get("user_id")

        if not user_id:
            return {"error": "Please provide user_id"}, 400

        request_id = str(user_id)

        if request_id in active_generations:
            generation_control.stop(request_id)
            del active_generations[request_id]
            return jsonify({"status": "success", "message": "Generation stopped"})
        else:
            return jsonify(
                {"status": "not_found", "message": "No active generation found"}
            )

    except Exception as e:
        return jsonify({"error": f"Error stopping generation: {str(e)}"}), 500


@app.route("/active_generations", methods=["GET"])
async def get_active_generations():
    """Get list of active generations"""
    return jsonify(
        {
            "active_generations": list(active_generations.keys()),
            "count": len(active_generations),
        }
    )


if __name__ == "__main__":
    # Run the Quart app
    app.run(host="0.0.0.0", port=8002, debug=True)
