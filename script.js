// --- Coin98 & Dexscreener Integration --- //

let walletConnected = false;

// Detect Coin98 provider
async function detectWallet() {
  if (window.coin98) {
    console.log("Coin98 detected ✅");
  } else {
    alert("Please open in Coin98 browser or install Coin98 wallet.");
  }
}

// Connect wallet
async function connectWallet() {
  try {
    await window.coin98.sol.request({ method: "connect" });
    walletConnected = true;
    const accounts = await window.coin98.sol.request({ method: "getAccounts" });
    document.getElementById("wallet-status").innerText = 
      `Connected: ${accounts[0].slice(0, 4)}...${accounts[0].slice(-4)}`;
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

// Load DexScreener data
async function loadDexData(mint) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const data = await res.json();
    const token = data.pairs?.[0];
    if (!token) throw new Error("Token not found.");

    document.getElementById("token-name").innerText = token.baseToken.name;
    document.getElementById("token-price").innerText = `$${token.priceUsd}`;
    document.getElementById("chart-frame").src = `https://dexscreener.com/solana/${mint}?embed=1`;
  } catch (err) {
    document.getElementById("token-price").innerText = "⚠️ Error loading price";
    console.error(err);
  }
}

// Execute buy or sell
async function executeTrade(type) {
  if (!walletConnected) return alert("Connect your Coin98 wallet first.");

  const mint = document.getElementById("token-input").value.trim();
  const amount = document.getElementById("amount").value;
  alert(`${type} ${amount} SOL worth of ${mint} — confirm in wallet.`);
  // Placeholder — your Jupiter trade call would go here
}

// Auto detect wallet
window.addEventListener("load", detectWallet);
