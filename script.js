document.addEventListener('DOMContentLoaded', async () => {
    const loadButton = document.getElementById('loadToken');
    const tokenInput = document.getElementById('tokenAddress');
    const tokenDataDiv = document.getElementById('tokenData');

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
            const volume24h = pair.volume?.h24 ? `$${Number(pair.volume.h24).toLocaleString()}` : 'N/A';
            const baseToken = pair.baseToken?.symbol ?? 'Unknown';
            const quoteToken = pair.quoteToken?.symbol ?? 'Unknown';

            tokenDataDiv.innerHTML = `
                <h2>${baseToken} (${pair.baseToken.address.slice(0, 6)}...)</h2>
                <p>💰 Price: <strong>$${price}</strong></p>
                <p>📈 24h Change: <span style="color:${change24h >= 0 ? 'green' : 'red'}">${change24h}%</span></p>
                <p>🔄 Volume (24h): ${volume24h}</p>
                <p>Pair: ${baseToken}/${quoteToken}</p>

                <div style="margin-top: 15px;">
                    <a href="https://jup.ag/swap/USDC-${tokenAddress}" 
                       target="_blank" 
                       style="background:green;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;margin-right:10px;">
                       💚 Buy
                    </a>
                    <a href="https://jup.ag/swap/${tokenAddress}-USDC" 
                       target="_blank" 
                       style="background:red;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">
                       ❤️ Sell
                    </a>
                </div>
            `;
        } catch (error) {
            console.error('Error loading token data:', error);
            tokenDataDiv.innerHTML = '<p>Error fetching token data. Please try again later.</p>';
        }
    });
});
