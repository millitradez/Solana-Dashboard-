// =========================
// Solana Dashboard Frontend
// =========================

const BACKEND_URL = window.location.origin;
let wallet = null;
let currentToken = null;
let chart;

// -----------------------------
// Utility logging
// -----------------------------
function log(msg) {
  const logBox = document.getElementById("logs");
  if (!logBox) return;
  const p = document.createElement("p");
  p.textContent = msg;
  logBox.prepend(p);
  console.log(msg);
}

// -----------------------------
// Wallet connection
// -----------------------------
async function connectWallet() {
  try {
    if (!window.coin98?.sol) {
      alert("Coin98 wallet not detected.");
      return;
    }
    const publicKey = await window.coin98.sol.request({ method: "sol_requestAccounts" });
    wallet = { publicKey };
    document.getElementById("walletStatus").innerText = `🔗 Connected: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
    log(`✅ Wallet connected: ${publicKey}`);
  } catch (err) {
    log(`❌ Wallet connection failed: ${err.message}`);
  }
}

// -----------------------------
// Load Token Info via DexScreener
// -----------------------------
async function loadToken() {
  const address = document.getElementById("tokenAddress").value.trim();
  if (!address) return alert("Enter a valid token address.");

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    const data = await res.json();

    if (!data || !data.pairs || data.pairs.length === 0) {
      alert("Token not found on DexScreener.");
      return;
    }

    const token = data.pairs[0];
    currentToken = token;

    document.getElementById("tokenInfo").innerHTML = `
      <h2>${token.baseToken.name} (${token.baseToken.symbol}) • ${token.chainId.toUpperCase()}</h2>
      <p><b>💵 Current Price (USD)</b>: $${parseFloat(token.priceUsd).toFixed(6)}</p>
      <p>24h Change: ${parseFloat(token.priceChange.h24).toFixed(2)}%</p>
    `;

    // Draw chart
    loadChart(token);
  } catch (err) {
    log(`❌ Failed to load token info: ${err.message}`);
  }
}

// -----------------------------
// Draw price chart (Chart.js)
// -----------------------------
function loadChart(token) {
  const ctx = document.getElementById("priceChart");
  if (!ctx) return;

  const prices = (token?.priceHistory || []).map((p, i) => ({
    x: new Date(Date.now() - (token.priceHistory.length - i) * 3600000),
    y: parseFloat(p.priceUsd),
  }));

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "24-Hour Price Trend",
        data: prices,
        borderWidth: 2,
        borderColor: "#007bff",
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { type: "time", time: { unit: "hour" } },
        y: { beginAtZero: false }
      }
    }
  });
}

// -----------------------------
// Get Jupiter Quote
// -----------------------------
async function getQuote() {
  const amount = document.getElementById("amount").value;
  const slippage = document.getElementById("slippage").value || 1;
  if (!wallet || !currentToken) return log("⚠️ Connect wallet and load token first.");

  try {
    const inputMint = "So11111111111111111111111111111111111111112"; // SOL
    const outputMint = currentToken.baseToken.address;
    const lamports = parseFloat(amount) * 1e9;

    const res = await fetch(`${BACKEND_URL}/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage * 100}`);
    const data = await res.json();

    if (data.error) {
      log(`❌ Quote error: ${data.error}`);
      return;
    }

    window.currentQuote = data;
    log("✅ Quote received successfully.");
  } catch (err) {
    log(`❌ Quote failed: ${err.message}`);
  }
}

// -----------------------------
// Execute Swap
// -----------------------------
async function executeSwap() {
  if (!window.currentQuote) return log("⚠️ Get quote first.");
  if (!wallet) return log("⚠️ Connect wallet first.");

  try {
    const balRes = await fetch(`${BACKEND_URL}/api/balance/${wallet.publicKey}`);
    const { balance } = await balRes.json();
    const amount = parseFloat(document.getElementById("amount").value);

    if (balance < amount) {
      log("❌ Not enough SOL to complete transaction.");
      return;
    }

    const res = await fetch(`${BACKEND_URL}/api/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: window.currentQuote,
        userPublicKey: wallet.publicKey,
      }),
    });

    const data = await res.json();
    if (data.error) return log(`❌ Swap failed: ${data.error}`);

    const txBase64 = data.swapTransaction;
    log("⚡ Signing transaction in Coin98...");

    const signedTx = await window.coin98.sol.request({
      method: "sol_signAndSendTransaction",
      params: [txBase64],
    });

    log(`✅ Swap executed! Signature: ${signedTx}`);
  } catch (err) {
    log(`❌ Execution failed: ${err.message}`);
  }
}

// -----------------------------
// Event Listeners
// -----------------------------
document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
document.getElementById("loadTokenBtn")?.addEventListener("click", loadToken);
document.getElementById("quoteBtn")?.addEventListener("click", getQuote);
document.getElementById("swapBtn")?.addEventListener("click", executeSwap);
