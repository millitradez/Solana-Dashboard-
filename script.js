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

        const res = await fetch(`/api/token/${tokenAddress}`);
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
    } catch (err) {
        console.error(err);
        alert("Failed to fetch token info.");
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
// Buy / Sell Buttons
// ---------------------------
async function handleSwap(isBuy) {
    const wallet = document.getElementById("wallet").value.trim();
    const amountInput = document.getElementById("amount").value.trim();
    const slippage = document.getElementById("slippage").value || "100";

    if (!wallet) return alert("Connect your wallet.");
    if (!amountInput) return alert("Enter an amount.");

    const amountLamports = Math.floor(parseFloat(amountInput) * 1e9);

    const inputMint = isBuy ? SOL_MINT : selectedToken;
    const outputMint = isBuy ? selectedToken : SOL_MINT;

    try {
        const quoteRes = await fetch(`/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippage}`);
        const quote = await quoteRes.json();

        if (quote.error) throw new Error(quote.error);

        const swapRes = await fetch("/api/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quoteResponse: quote,
                userPublicKey: wallet
            })
        });

        const swapData = await swapRes.json();
        if (swapData.error) {
            if (swapData.error.includes("insufficient funds")) {
                alert("Not enough SOL for this transaction.");
            } else {
                alert("Quote error: " + swapData.error);
            }
            return;
        }

        alert("✅ Transaction prepared! Ready to sign in wallet.");
    } catch (err) {
        console.error(err);
        alert("Quote error or swap failed.");
    }
}
