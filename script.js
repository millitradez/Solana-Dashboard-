const tokenInput = document.getElementById("tokenAddress");
const tokenName = document.getElementById("tokenName");
const tokenPrice = document.getElementById("tokenPrice");
const tokenChange = document.getElementById("tokenChange");
const chartDiv = document.getElementById("chart");

async function loadToken() {
  const address = tokenInput.value.trim();
  if (!address) {
    alert("Please enter a token address.");
    return;
  }

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.pairs || !data.pairs.length) {
      tokenName.textContent = "Token not found.";
      tokenPrice.textContent = "";
      tokenChange.textContent = "";
      chartDiv.innerHTML = "";
      return;
    }

    const pair = data.pairs[0];
    tokenName.textContent = `${pair.baseToken.name} (${pair.baseToken.symbol})`;
    tokenPrice.textContent = `$${pair.priceUsd}`;
    tokenChange.textContent = `24h Change: ${pair.priceChange.h24}%`;

    chartDiv.innerHTML = `
      <iframe src="https://dexscreener.com/solana/${pair.pairAddress}?embed=1&theme=light"></iframe>
    `;
  } catch (err) {
    console.error(err);
    tokenName.textContent = "Error loading token data.";
  }
}

// --- Coin98 Integration ---
function buyToken() {
  const address = tokenInput.value.trim();
  if (!address) return alert("Enter a token first.");
  window.open(`https://coin98.net/swap?from=SOL&to=${address}`, "_blank");
}

function sellToken() {
  const address = tokenInput.value.trim();
  if (!address) return alert("Enter a token first.");
  window.open(`https://coin98.net/swap?from=${address}&to=SOL`, "_blank");
}
