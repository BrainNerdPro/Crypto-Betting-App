const axios = require("axios");

const ALCHEMY_API_KEY = "Xv6ujzF75VoLFfJhXV4KDt_J65f6nfuv"; // replace with your key
const TXID = "0x8f6aa6fe22cbf1acd78e0aadf7fc29987a897abbfee780cae11256d534e3b306"; // replace with a real tx hash

(async () => {
  try {
    const response = await axios.post(
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      {
        jsonrpc: "2.0",
        method: "eth_getTransactionByHash",
        params: [TXID],
        id: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const tx = response.data.result;
    if (!tx) {
      console.log("❌ Transaction not found (or key invalid).");
    } else {
      console.log("✅ Alchemy key is valid. Transaction found:");
      console.log(tx);
    }
  } catch (error) {
    console.error("❌ Error testing Alchemy key:", error.message);
  }
})();
