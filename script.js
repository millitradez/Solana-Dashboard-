const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
let selectedToken = USDC_MINT;
 
// ---------------------------
// Fetch Token Data + Chart
// ---------------------------
async function loadTokenInfo() {
    try {
        const tokenAddress = document.getElementById("tokenAddress").value.trim();
        if (!tokenAddress) return alert("Enter a token address.");
 
        console.log(`Fetching token info for: ${tokenAddress}`);
        const res = await fetch(`/api/token/${tokenAddress}`);
       
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
 
        const data = await res.json();
 
        const pair = data.pairs?.[0];
        if (!pair) throw new Error("Token not found.");
 
        document.getElementById("tokenName").innerText = `${pair.baseToken.symbol} • ${pair.chainId.toUpperCase()}`;
        document.getElementById("currentPrice").innerText = `$${parseFloat(pair.priceUsd).toFixed(6)}`;
        document.getElementById("change24h").innerText = `${parseFloat(pair.priceChange.h24).toFixed(2)}%`;
 
        const chartData = pair.priceChange.h24History?.map((v, i) => ({
            time: Date.now() - (24 - i) * 3600000,
            value: v
        })) || [];
 
        renderPriceChart(chartData);
        selectedToken = tokenAddress;
        console.log(`✅ Token loaded: ${tokenAddress}`);
    } catch (err) {
        console.error("Token fetch error:", err);
        alert(`Failed to fetch token info: ${err.message}`);
    }
}
 
// ---------------------------
// Chart.js - Clean style
// ---------------------------
function renderPriceChart(prices) {
    const ctx = document.getElementById("priceChart").getContext("2d");
    if (window.priceChart) window.priceChart.destroy();
 
    const labels = prices.map(p => new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const data = prices.map(p => p.value);
 
    window.priceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "24-Hour Price Trend",
                data: data,
                borderWidth: 2,
                borderColor: "#007aff",
                pointRadius: 0,
                tension: 0.4,
                fill: {
                    target: 'origin',
                    above: 'rgba(0, 122, 255, 0.05)',
                },
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1e1e1e",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 8,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: ctx => `$${ctx.parsed.y.toFixed(5)}`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: "#999" } },
                y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#999" } }
            }
        }
    });
}
 
// ---------------------------
// Buy / Sell Buttons (CORRECTED)
// ---------------------------
async function handleSwap(isBuy) {
    const wallet = document.getElementById("wallet").value.trim();
    const amountInput = document.getElementById("amount").value.trim();
    const slippage = document.getElementById("slippage").value || "100";
 
    // Validation
    if (!wallet) {
        alert("❌ Connect your wallet.");
        return;
    }
    if (!amountInput) {
        alert("❌ Enter an amount.");
        return;
    }
 
    // Validate wallet format (basic check)
    if (wallet.length < 32) {
        alert("❌ Invalid wallet address.");
        return;
    }
 
    // Parse amount and convert to lamports
    let amountLamports;
    try {
        amountLamports = Math.floor(parseFloat(amountInput) * 1e9);
        if (amountLamports <= 0) {
            alert("❌ Amount must be greater than 0.");
            return;
        }
    } catch (e) {
        alert("❌ Invalid amount format.");
        return;
    }
 
    // Determine input/output mints
    const inputMint = isBuy ? SOL_MINT : selectedToken;
    const outputMint = isBuy ? selectedToken : SOL_MINT;
    const swapType = isBuy ? "Buy" : "Sell";
 
    console.log(`\n🔄 Starting ${swapType} swap:`);
    console.log(`  Input: ${amountInput} (${amountLamports} lamports) of ${inputMint}`);
    console.log(`  Output: ${outputMint}`);
    console.log(`  Slippage: ${slippage} bps`);
    console.log(`  Wallet: ${wallet}`);
 
    try {
        // Step 1: Fetch quote from backend
        console.log("\n📡 Step 1: Fetching quote from backend...");
        const quoteUrl = `/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage}`;
        console.log(`  URL: ${quoteUrl}`);
 
        const quoteRes = await fetch(quoteUrl);
        console.log(`  Response status: ${quoteRes.status}`);
 
        if (!quoteRes.ok) {
            const errorData = await quoteRes.json();
            throw new Error(`Quote fetch failed (${quoteRes.status}): ${errorData.error || quoteRes.statusText}`);
        }
 
        const quote = await quoteRes.json();
        console.log(`  ✅ Quote received:`, quote);
 
        // Validate quote response
        if (!quote.outAmount) {
            throw new Error("Invalid quote: missing outAmount");
        }
 
        // Step 2: Create swap transaction
        console.log("\n📡 Step 2: Creating swap transaction...");
        const swapRes = await fetch("/api/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quoteResponse: quote,
                userPublicKey: wallet
            })
        });
 
        console.log(`  Response status: ${swapRes.status}`);
 
        if (!swapRes.ok) {
            const errorData = await swapRes.json();
            throw new Error(`Swap creation failed (${swapRes.status}): ${errorData.error || swapRes.statusText}`);
        }
 
        const swapData = await swapRes.json();
        console.log(`  ✅ Swap transaction created:`, swapData);
 
        // Success message
        const outAmount = (parseInt(quote.outAmount) / 1e9).toFixed(6);
        alert(`✅ ${swapType} successful!\n\nYou will receive: ${outAmount} tokens\n\nTransaction prepared and ready to sign in your wallet.`);
        console.log(`\n✅ Swap ready to sign!`);
 
    } catch (err) {
        console.error("\n❌ Error during swap:", err);
        alert(`❌ ${swapType} failed:\n\n${err.message}`);
    }
}
 
// ---------------------------
// Export functions for HTML
// ---------------------------
window.loadTokenInfo = loadTokenInfo;
window.handleSwap = handleSwap;
 
