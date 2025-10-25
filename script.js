// ==============================
// Solana Dashboard - Coin98 + Jupiter Swap Integration
// ==============================

// Replace with your own Flask backend (on Render, Vercel Functions, etc.)
const BACKEND_URL = "https://solana-dashboard-backend.vercel.app";

// Elements
const tokenInput = document.getElementById("tokenAddress");
const loadBtn = document.getElementById("loadToken");
const tokenDataDiv = document.getElementById("tokenData");
const logBox = document.getElementById("logs");
const buyBtn = document.getElementById("buyBtn");
const sellBtn = document.getElementById("sellBtn");
const connectBtn = document.getElementById("connectWallet");
const amountInput = document.getElementById("amount");
const slippageInput = document.getElementById("slippage");
const quoteBtn = document.getElementById("getQuote");
const executeBtn = document.getElementById("executeSwap");

let wallet = null;
window.currentQuote = null;

// Logger
function log(msg) {
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.prepend(p);
  console.log(msg);
}

// ==============================
// Wallet Connection
// ==============================
async function connectWallet() {
  try {
    if (!window.coin98?.sol) throw new Error("Coin98 not found");
    const accounts = await window.coin98.sol.request({ method: "sol_requestAccounts" });
    const publicKey = accounts[0];
    wallet = { publicKey };
    log(`✅ Wallet connected: ${publicKey}`);
  } catch (err) {
    log(`❌ Wallet connect failed: ${err.message}`);
  }
}

connectBtn?.addEventListener("click", connectWallet);

// ==============================
// Load Token Info via DexScreener
// ==============================
loadBtn?.addEventListener("click", async () => {
  const tokenAddr = tokenInput.value.trim();
  if (!tokenAddr) return log("⚠️ Enter a token address first.");
  tokenDataDiv.innerHTML = "⏳ Loading...";

  try {
    const res = await fetch(`${BACKEND_URL}/api/token/${tokenAddr}`);
    const data = await res.json();

    if (!data || !data.pairs || !data.pairs[0]) {
      tokenDataDiv.innerHTML = "❌ Token not found.";
      return;
    }

    const pair = data.pairs[0];
    const { baseToken, priceUsd, priceChange } = pair;

    tokenDataDiv.innerHTML = `
      <h3>${baseToken.symbol} (${baseToken.name})</h3>
      <p>💲 Price: $${priceUsd}</p>
      <p>📈 24h Change: ${priceChange?.h24 || 0}%</p>
      <iframe src="https://dexscreener.com/solana/${tokenAddr}?embed=1&theme=dark"
        width="100%" height="400" style="border:none;"></iframe>
    `;

    log(`✅ DexScreener loaded for ${tokenAddr}`);
  } catch (err) {
    log(`❌ DexScreener error: ${err.message}`);
  }
});

// ==============================
// Get Jupiter Quote
// ==============================
quoteBtn?.addEventListener("click", async () => {
  if (!wallet) return log("⚠️ Connect wallet first.");
  const tokenAddr = tokenInput.value.trim();
  const amount = parseFloat(amountInput.value);
  if (!tokenAddr || !amount) return log("⚠️ Enter token and amount.");

  const slippage = parseFloat(slippageInput.value || "1");
  const inputMint = "So11111111111111111111111111111111111111112"; // SOL
  const outputMint = tokenAddr;
  const lamports = Math.floor(amount * 1e9); // SOL → Lamports
  const slippageBps = Math.floor(slippage * 100);

  try {
    log("🔄 Requesting Jupiter quote...");
    const res = await fetch(
      `${BACKEND_URL}/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippageBps}`
    );

    const data = await res.json();
    if (data.error || !data.outAmount) {
      log("❌ Quote error: Load failed");
      return;
    }

    window.currentQuote = data;
    const outTokens = parseFloat(data.outAmount) / Math.pow(10, data.outputMintDecimals || 6);
    log(`✅ Quote: ${amount} SOL ≈ ${outTokens.toFixed(4)} ${data.outputMintSymbol || "TOKEN"}`);
  } catch (err) {
    log(`❌ Quote fetch failed: ${err.message}`);
  }
});

// ==============================
// Execute Swap - Path B
// ==============================
executeBtn?.addEventListener("click", async () => {
  if (!window.currentQuote) return log("⚠️ Get a quote first.");
  if (!wallet) return log("⚠️ Connect wallet first.");

  try {
    log("🔄 Creating Jupiter swap transaction...");
    const res = await fetch(`${BACKEND_URL}/api/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: window.currentQuote,
        userPublicKey: wallet.publicKey,
      }),
    });

    const data = await res.json();
    if (data.error) {
      log(`❌ Swap creation failed: ${data.error}`);
      return;
    }

    const txBase64 = data.swapTransaction;
    log("⚡ Transaction created, sending to Coin98...");

    const signedTx = await window.coin98.sol.request({
      method: "sol_signAndSendTransaction",
      params: [txBase64],
    });

    log(`✅ Swap executed successfully! Signature: ${signedTx}`);
  } catch (err) {
    log(`❌ Swap execution failed: ${err.message}`);
  }
});
