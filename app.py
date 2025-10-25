from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging
 
app = Flask(__name__)
CORS(app)
 
# Setup logging for debugging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
 
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
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        return jsonify(res.json())
    except requests.exceptions.Timeout:
        logger.error(f"DexScreener timeout for {token_address}")
        return jsonify({"error": "Token fetch timeout"}), 504
    except requests.exceptions.HTTPError as e:
        logger.error(f"DexScreener HTTP error: {e}")
        return jsonify({"error": f"Token not found: {e}"}), 400
    except Exception as e:
        logger.error(f"DexScreener error: {str(e)}")
        return jsonify({"error": str(e)}), 400
 
# ---------------------------
# Jupiter Quote (CORRECTED)
# ---------------------------
@app.route("/api/quote", methods=["GET"])
def get_quote():
    """Fetch a Jupiter quote for the swap - CORRECTED VERSION"""
    try:
        # Get parameters from query string
        input_mint = request.args.get("inputMint")
        output_mint = request.args.get("outputMint")
        amount = request.args.get("amount")
        slippage_bps = request.args.get("slippageBps", "100")
 
        # Validate parameters
        if not all([input_mint, output_mint, amount]):
            logger.warning(f"Missing parameters: inputMint={input_mint}, outputMint={output_mint}, amount={amount}")
            return jsonify({"error": "Missing required parameters: inputMint, outputMint, amount"}), 400
 
        # Validate amount is a number
        try:
            amount_int = int(amount)
            if amount_int <= 0:
                return jsonify({"error": "Amount must be greater than 0"}), 400
        except ValueError:
            return jsonify({"error": "Amount must be a valid integer (lamports)"}), 400
 
        # Build the Jupiter quote URL
        url = f"{JUPITER_API}/quote"
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": amount,
            "slippageBps": slippage_bps
        }
 
        logger.info(f"Requesting Jupiter quote: {params}")
 
        # Make the request to Jupiter API
        res = requests.get(url, params=params, timeout=15)
       
        # Check if the request was successful
        if res.status_code != 200:
            error_msg = f"Jupiter API returned status {res.status_code}"
            logger.error(f"{error_msg}: {res.text}")
            return jsonify({"error": error_msg, "details": res.text}), 400
 
        # Parse the response
        data = res.json()
 
        # Check if Jupiter returned an error in the response
        if "error" in data:
            logger.error(f"Jupiter error: {data['error']}")
            return jsonify({"error": f"Jupiter API error: {data['error']}"}), 400
 
        # Validate that we got the expected fields
        if "outAmount" not in data or "routePlan" not in data:
            logger.error(f"Unexpected Jupiter response format: {data}")
            return jsonify({"error": "Invalid quote response from Jupiter"}), 400
 
        logger.info(f"Quote successful: {amount} {input_mint} -> {data.get('outAmount')} {output_mint}")
        return jsonify(data), 200
 
    except requests.exceptions.Timeout:
        logger.error("Jupiter API timeout")
        return jsonify({"error": "Jupiter API timeout - try again"}), 504
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error to Jupiter: {e}")
        return jsonify({"error": "Cannot connect to Jupiter API"}), 503
    except Exception as e:
        logger.error(f"Unexpected error in quote: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
 
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
            logger.warning("Missing quote_response or user_public_key")
            return jsonify({"error": "Missing quoteResponse or userPublicKey"}), 400
 
        # Validate that quote_response has required fields
        if "routePlan" not in quote_response:
            logger.error(f"Invalid quote response: {quote_response}")
            return jsonify({"error": "Invalid quote response format"}), 400
 
        swap_payload = {
            "quoteResponse": quote_response,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": True,
            "dynamicComputeUnitLimit": True,
        }
 
        logger.info(f"Creating swap for user: {user_public_key}")
 
        res = requests.post(f"{JUPITER_API}/swap", json=swap_payload, timeout=15)
       
        if res.status_code != 200:
            error_msg = f"Jupiter swap API returned status {res.status_code}"
            logger.error(f"{error_msg}: {res.text}")
            return jsonify({"error": error_msg, "details": res.text}), 400
 
        swap_data = res.json()
 
        if "swapTransaction" not in swap_data:
            logger.error(f"No swapTransaction in response: {swap_data}")
            return jsonify({"error": "Quote or Swap creation failed", "details": swap_data}), 400
 
        logger.info("Swap transaction created successfully")
        return jsonify({
            "swapTransaction": swap_data["swapTransaction"]
        }), 200
 
    except requests.exceptions.Timeout:
        logger.error("Jupiter swap API timeout")
        return jsonify({"error": "Swap API timeout"}), 504
    except Exception as e:
        logger.error(f"Swap error: {str(e)}")
        return jsonify({"error": str(e)}), 500
 
@app.route("/")
def home():
    return "🚀 Solana Dashboard API running."
 
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
