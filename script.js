const backendBaseUrl = "https://millitradez-2.onrender.com";

// ===== Load Token Info =====
async function loadTokenInfo() {
  const tokenAddress = document.getElementById("tokenAddress").value.trim();
  const walletAddress = document.getElementById("walletAddress").value.trim();

  if (!tokenAddress) {
    alert("Please enter a token address");
    return;
  }

  try {
    const res = await fetch(`${backendBaseUrl}/api/token/${tokenAddress}`);
    if (!res.ok) throw new Error("Failed to fetch token info");

    const data = await res.json();

    document.getElementById("tokenName").textContent = data.name || "Unknown";
    document.getElementById("tokenSymbol").textContent = data.symbol || "";
    document.getElementById("tokenPrice").textContent = `$${data.price?.toFixed(4) || "0.00"}`;
    document.getElementById("priceChange").textContent = `${data.change24h || 0}%`;

    document.getElementById("priceChange").style.color =
      data.change24h >= 0 ? "#00ff00" : "#ff0000";
  } catch (err) {
    console.error(err);
    alert("Error fetching token data");
  }
}

// ===== Get Quote =====
async function getQuote() {
  const inputMint = document.getElementById("inputMint").value.trim();
  const outputMint = document.getElementById("outputMint").value.trim();
  const amount = document.getElementById("swapAmount").value.trim();
  const slippage = 50; // 0.5%

  if (!inputMint || !outputMint || !amount) {
    alert("Please enter all swap details");
    return;
  }

  try {
    const amountLamports = Math.floor(parseFloat(amount) * 1e9);
    const quoteUrl = `${backendBaseUrl}/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage}`;
    const res = await fetch(quoteUrl);

    if (!res.ok) throw new Error("Failed to fetch quote");

    const data = await res.json();

    document.getElementById("quoteOutput").textContent = `
      ${data.outAmount ? (data.outAmount / 1e9).toFixed(6) : "0"} tokens
      (${data.priceImpactPct ? (data.priceImpactPct * 100).toFixed(2) : "0"}% impact)
    `;
  } catch (err) {
    console.error(err);
    alert("Error fetching quote");
  }
}

// ===== Execute Swap =====
async function executeSwap() {
  const walletAddress = document.getElementById("walletAddress").value.trim();
  const inputMint = document.getElementById("inputMint").value.trim();
  const outputMint = document.getElementById("outputMint").value.trim();
  const amount = document.getElementById("swapAmount").value.trim();
  const slippageBps = 50;

  if (!walletAddress || !inputMint || !outputMint || !amount) {
    alert("Please fill out all fields before swapping");
    return;
  }

  try {
    const amountLamports = Math.floor(parseFloat(amount) * 1e9);

    const res = await fetch(`${backendBaseUrl}/api/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: walletAddress,
        inputMint,
        outputMint,
        amount: amountLamports,
        slippageBps,
      }),
    });

    if (!res.ok) throw new Error("Swap failed");
    const data = await res.json();

    alert(`Swap executed successfully! Signature: ${data.signature}`);
  } catch (err) {
    console.error(err);
    alert("Error executing swap");
  }
}

// ===== Event Listeners =====
document.getElementById("loadTokenBtn")?.addEventListener("click", loadTokenInfo);
document.getElementById("quoteBtn")?.addEventListener("click", getQuote);
document.getElementById("swapBtn")?.addEventListener("click", executeSwap);
