from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Jupiter API base URL
JUPITER_API = "https://quote-api.jup.ag/v6"

# ---------------------------
# Token Data Route
# ---------------------------
@app.route("/api/token/<token_address>", methods=["GET"])
def get_token_info(token_address):
    """Fetch token info from DexScreener"""
    try:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
        res = requests.get(url)
        res.raise_for_status()
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ---------------------------
# Jupiter Quote
# ---------------------------
@app.route("/api/quote", methods=["GET"])
def get_quote():
    """Fetch a Jupiter quote for the swap"""
    try:
        input_mint = request.args.get("inputMint")
        output_mint = request.args.get("outputMint")
        amount = request.args.get("amount")
        slippage_bps = request.args.get("slippageBps", "100")

        if not all([input_mint, output_mint, amount]):
            return jsonify({"error": "Missing parameters"}), 400

        url = f"{JUPITER_API}/quote?inputMint={input_mint}&outputMint={output_mint}&amount={amount}&slippageBps={slippage_bps}"
        res = requests.get(url)
        data = res.json()

        if "error" in data:
            return jsonify({"error": data["error"]}), 400

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ---------------------------
# Jupiter Swap
# ---------------------------
@app.route("/api/swap", methods=["POST"])
def create_swap():
    """Create a Jupiter swap transaction"""
    try:
        data = request.json
        quote_response = data.get("quoteResponse")
        user_public_key = data.get("userPublicKey")

        if not quote_response or not user_public_key:
            return jsonify({"error": "Missing quote or wallet"}), 400

        swap_payload = {
            "quoteResponse": quote_response,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": True,
            "dynamicComputeUnitLimit": True,
        }

        res = requests.post(f"{JUPITER_API}/swap", json=swap_payload)
        swap_data = res.json()

        if "swapTransaction" not in swap_data:
            return jsonify({"error": "Quote or Swap creation failed", "details": swap_data}), 400

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
