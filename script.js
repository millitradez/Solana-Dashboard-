// ==============================
// Solana Dashboard Script (Path B)
// ==============================

let wallet = null;
let connection = null;
let tokenAddress = "";
let side = "buy"; // Default: Buy (SOL → token)

// HTML elements
const connectBtn = document.getElementById("connectWallet");
const tokenInput = document.getElementById("tokenAddress");
const loadBtn = document.getElementById("loadToken");
const buyBtn = document.getElementById("buyBtn");
const sellBtn = document.getElementById("sellBtn");
const amountInput = document.getElementById("amountInput");
const slippageInput = document.getElementById("slippageInput");
const getQuoteBtn = document.getElementById("getQuoteBtn");
const executeBtn = document.getElementById("executeSwapBtn");
const logBox = document.getElementById("logs");

// Jupiter + default mints
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const BACKEND_URL = "https://solana-dashboard-1ui9.vercel.app"; // your vercel domain

// ==============================
// Logging Helper
// ==============================
function log(message) {
  const time = new Date().toLocaleTimeString();
  logBox.value += `[${time}] ${message}\n`;
  logBox.scrollTop = logBox.scrollHeight;
  console.log(message);
}

// ==============================
// Connect Wallet (Coin98)
// ==============================
connectBtn.addEventListener("click", async () => {
  try {
    if (window.coin98?.sol) {
      await window.coin98.sol.connect();
      const accounts = await window.coin98.sol.request({ method: "sol_accounts" });
      wallet = accounts[0];
      log(`✅ Connected: ${wallet.publicKey}`);
    } else {
      log("❌ Coin98 not detected. Please open in Coin98 browser.");
    }
  } catch (err) {
    log(`❌ Wallet connection error: ${err.message}`);
  }
});

// ==============================
// Load Token Info via DexScreener
// ==============================
loadBtn.addEventListener("click", async () => {
  tokenAddress = tokenInput.value.trim();
  if (!tokenAddress) return log("⚠️ Enter a valid token address.");

  try {
    const res = await fetch(`${BACKEND_URL}/api/token/${tokenAddress}`);
    const data = await res.json();

    if (data?.pairs?.length) {
      const pair = data.pairs[0];
      log(`✅ Loaded: ${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
      document.getElementById("dexFrame").src = `https://dexscreener.com/solana/${tokenAddress}?embed=1&theme=dark`;
    } else {
      log("⚠️ Token not found on DexScreener.");
    }
  } catch (err) {
    log(`❌ Failed to load token: ${err.message}`);
  }
});

// ==============================
// Side Select (Buy / Sell)
// ==============================
buyBtn.addEventListener("click", () => {
  side = "buy";
  buyBtn.classList.add("active");
  sellBtn.classList.remove("active");
  log("🟢 Selected: BUY (SOL → Token)");
});

sellBtn.addEventListener("click", () => {
  side = "sell";
  sellBtn.classList.add("active");
  buyBtn.classList.remove("active");
  log("🔴 Selected: SELL (Token → SOL)");
});

// ==============================
// Get Quote (from Jupiter via backend)
// ==============================
getQuoteBtn.addEventListener("click", async () => {
  if (!tokenAddress) return log("⚠️ Load a token first.");
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) return log("⚠️ Enter a valid amount.");

  const slippage = parseFloat(slippageInput.value || 1);
  log(`💬 Requesting Jupiter quote...`);

  const inputMint = side === "buy" ? SOL_MINT : tokenAddress;
  const outputMint = side === "buy" ? tokenAddress : SOL_MINT;
  const lamports = Math.floor(amount * 1e9);

  try {
    const url = `${BACKEND_URL}/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage * 100}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) return log(`❌ Quote error: ${data.error}`);
    log(`✅ Quote received! Out amount ≈ ${(data.outAmount / 1e9).toFixed(6)} units`);
    window.currentQuote = data;
  } catch (err) {
    log(`❌ Quote request failed: ${err.message}`);
  }
});

// ==============================
// Execute Swap (via Coin98 signing Jupiter transaction)
// ==============================
executeBtn.addEventListener("click", async () => {
  if (!window.currentQuote) return log("⚠️ No quote available. Get a quote first.");
  if (!wallet) return log("⚠️ Connect your wallet first.");

  try {
    log("🔄 Executing swap...");
    // This is where you'd call Jupiter’s /swap API to create a transaction
    // and then send it for signing by Coin98 wallet.
    // For security, this should happen via backend (not direct JS).

    log("⚡ Swap execution simulated (Coin98 signing placeholder)");
  } catch (err) {
    log(`❌ Swap execution failed: ${err.message}`);
  }
});
