import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");

// Connect wallet
async function connectCoin98() {
  if (!window.coin98 || !window.coin98.sol) {
    alert("Please install or open Coin98 Wallet");
    return null;
  }
  const res = await window.coin98.sol.request({ method: "connect" });
  return res?.publicKey;
}

// Execute a buy (swap)
async function executeBuy(sellMint, buyMint, amount) {
  const pubkey = await connectCoin98();
  if (!pubkey) return;

  // Step 1: Fetch route from Jupiter API
  const routeResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${sellMint}&outputMint=${buyMint}&amount=${amount}&slippageBps=100`);
  const route = await routeResponse.json();

  // Step 2: Create swap transaction
  const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: route.data[0],
      userPublicKey: pubkey,
      wrapAndUnwrapSol: true,
    }),
  });

  const { swapTransaction } = await swapResponse.json();
  const transactionBuf = Buffer.from(swapTransaction, "base64");

  // Step 3: Ask Coin98 to sign
  const signed = await window.coin98.sol.request({
    method: "signAndSendTransaction",
    params: [transactionBuf.toString("base64")],
  });

  alert(`✅ Transaction sent! Tx: ${signed}`);
}
