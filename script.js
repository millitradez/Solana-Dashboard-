const BACKEND_URL = "https://millitradez-2.onrender.com";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
let selectedToken = USDC_MINT;

async function loadTokenInfo() {
    const tokenAddress = document.getElementById("tokenAddress").value.trim();
    if (!tokenAddress) return alert("Enter a token address.");

    try {
        console.log(`Fetching token info for ${tokenAddress}`);
        const res = await fetch(`${BACKEND_URL}/api/token/${tokenAddress}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const pair = data.pairs?.[0];
        if (!pair) throw new Error("No token data found.");

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
        console.error("❌ Token fetch failed:", err);
        alert(`Failed to fetch token data: ${err.message}`);
    }
}

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
                label: "24h Price",
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

window.loadTokenInfo = loadTokenInfo;
