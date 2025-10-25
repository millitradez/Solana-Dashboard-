from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import json

app = Flask(__name__)
CORS(app)

# Jupiter API base URLs
JUPITER_API = "https://quote-api.jup.ag/v6"

# ---------------------------
# Routes
# ---------------------------

@app.route("/api/token/<token_address>", methods=["GET"])
def get_token_info(token_address):
    """Proxy DexScreener token lookup"""
    try:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
        res = requests.get(url)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/quote", methods=["GET"])
def get_quote():
    """Fetch Jupiter quote for swap"""
    try:
        input_mint = request.args.get("inputMint")
        output_mint = request.args.get("outputMint")
        amount = request.args.get("amount")
        slippage_bps = request.args.get("slippageBps", "100")

        url = f"{JUPITER_API}/quote?inputMint={input_mint}&outputMint={output_mint}&amount={amount}&slippageBps={slippage_bps}"
        res = requests.get(url)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/swap", methods=["POST"])
def create_swap():
    """Create Jupiter swap transaction"""
    try:
        data = request.json
        quote_response = data.get("quoteResponse")
        user_public_key = data.get("userPublicKey")

        if not quote_response or not user_public_key:
            return jsonify({"error": "Missing parameters"}), 400

        swap_payload = {
            "quoteResponse": quote_response,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": True,
            "dynamicComputeUnitLimit": True,
        }

        res = requests.post(f"{JUPITER_API}/swap", json=swap_payload)
        swap_data = res.json()

        if "swapTransaction" not in swap_data:
            return jsonify({"error": "Jupiter swap creation failed", "details": swap_data}), 400

        # Return base64-encoded transaction to frontend
        return jsonify({
            "swapTransaction": swap_data["swapTransaction"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/")
def home():
    return "🚀 Solana Dashboard API running."


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
