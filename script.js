// Check if Coin98 Wallet is available
const connectWalletBtn = document.getElementById("connectWallet");
const walletAddressDiv = document.getElementById("walletAddress");
const balanceDiv = document.getElementById("balance");
const solDataDiv = document.getElementById("solData");

let connection;
let publicKey;

async function connectWallet() {
  try {
    if (!window.solana || !window.solana.isCoin98) {
      alert("Please install or open Coin98 Wallet.");
      return;
    }

    const resp = await window.solana.connect();
    publicKey = resp.publicKey.toString();
    walletAddressDiv.innerHTML = `🔗 Connected: ${publicKey.substring(0, 5)}...${publicKey.slice(-4)}`;

    connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"), "confirmed");
    await getBalance();

    solDataDiv.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Connection failed. Try again.");
  }
}

async function getBalance() {
  try {
    const balanceLamports = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
    const balanceSol = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;
    balanceDiv.textContent = balanceSol.toFixed(3);
  } catch (err) {
    balanceDiv.textContent = "Error";
    console.error("Error getting balance:", err);
  }
}

document.getElementById("buyBtn").addEventListener("click", () => {
  alert("Buy SOL coming soon via Coin98 API");
});

document.getElementById("sellBtn").addEventListener("click", () => {
  alert("Sell SOL coming soon via Coin98 API");
});

connectWalletBtn.addEventListener("click", connectWallet);
