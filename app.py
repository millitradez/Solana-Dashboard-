from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Base URLs
DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens/"
JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote"

# ✅ Root route (optional)
@app.route("/")
def home():
    return jsonify({"message": "Solana Dashboard backend active 🚀"})


# ✅ DexScreener token data
@app.route("/api/token/<address>", methods=["GET"])
def get_token_data(address):
    """
    Fetch token data from DexScreener API by Solana token address
    """
    try:
        url = f"{DEXSCREENER_API}{address}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


# ✅ Jupiter quote proxy (fixes 'Quote error: Load failed')
@app.route("/api/quote", methods=["GET"])
def get_quote():
    """
    Fetch a quote from Jupiter API safely via backend proxy.
    """
    try:
        input_mint = request.args.get("inputMint")
        output_mint = request.args.get("outputMint")
        amount = request.args.get("amount")
        slippage_bps = request.args.get("
