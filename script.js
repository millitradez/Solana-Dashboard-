document.addEventListener('DOMContentLoaded', async () => {
    const loadButton = document.getElementById('loadToken');
    const tokenInput = document.getElementById('tokenAddress');
    const tokenDataDiv = document.getElementById('tokenData');
    const buyBtn = document.getElementById('buyButton');
    const sellBtn = document.getElementById('sellButton');

    // Enable the Load button when something is typed
    tokenInput.addEventListener('input', () => {
        loadButton.disabled = tokenInput.value.trim() === '';
    });

    loadButton.addEventListener('click', async () => {
        const tokenAddress = tokenInput.value.trim();
        if (!tokenAddress) {
            alert('Please enter a valid Solana token address.');
            return;
        }

        tokenDataDiv.innerHTML = '<p>Loading token data...</p>';

        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            const data = await response.json();

            if (!data.pairs || data.pairs.length === 0) {
                tokenDataDiv.innerHTML = '<p>No token data found for this address.</p>';
                return;
            }

            const pair = data.pairs[0];
            const price = parseFloat(pair.priceUsd).toFixed(8);
            const change24h = pair.priceChange?.h24 ?? 0;
            const baseToken = pair.baseToken?.symbol ?? 'Unknown';
            const quoteToken = pair.quoteToken?.symbol ?? 'Unknown';
            const volume24h = pair.volume?.h24 ? `$${Number(pair.volume.h24).toLocaleString()}` : 'N/A';

            // Update info area
            tokenDataDiv.innerHTML = `
                <h2>${baseToken}</h2>
                <p>💰 Price: <strong>$${price}</strong></p>
                <p>📈 24h Change: <span style="color:${change24h >= 0 ? 'green' : 'red'}">${change24h}%</span></p>
                <p>🔄 Volume (24h): ${volume24h}</p>
            `;

            // Activate Buy/Sell links dynamically
            buyBtn.onclick = () => {
                window.open(`https://jup.ag/swap/USDC-${tokenAddress}`, '_blank');
            };
            sellBtn.onclick = () => {
                window.open(`https://jup.ag/swap/${tokenAddress}-USDC`, '_blank');
            };

        } catch (error) {
            console.error('Error loading token data:', error);
            tokenDataDiv.innerHTML = '<p>Error fetching token data. Try again later.</p>';
        }
    });
});
