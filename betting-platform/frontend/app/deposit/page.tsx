"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
//import { ClipboardIcon } from "lucide-react"
import {
  BanknotesIcon, ClipboardIcon, CheckCircleIcon, XCircleIcon} from "@heroicons/react/24/outline";


export default function DepositPage() {
  const [username, setUsername] = useState("")
  const [senderAddress, setSenderAddress] = useState("")
  const [txid, setTxid] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" })
  const [step, setStep] = useState(1) // Step 1: Enter sender address, Step 2: Show deposit address and TXID field
  const [walletAddress, setWalletAddress] = useState("");

  const router = useRouter()
  //const walletAddress = "0x1234567890abcdef1234567890abcdef12345678"

  useEffect(() => {
    // Check if user is logged in
    const storedUsername = localStorage.getItem("username")
    if (!storedUsername) {
      router.push("/login")
      return
    }
    setUsername(storedUsername)

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deposit-address`)
    .then(res => res.json())
    .then(data => setWalletAddress(data.address))
    .catch(() => setMessage({ text: "Failed to load deposit address", type: "error" }));

  }, [router])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
    setMessage({ text: "Address copied to clipboard", type: "success" })
    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const handleSenderAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!senderAddress.trim()) {
      setMessage({ text: "Please enter your sender address", type: "error" })
      return
    }

    // Validate the address format (basic check for Ethereum address)
    if (!senderAddress.startsWith("0x") || senderAddress.length !== 42) {
      setMessage({ text: "Please enter a valid wallet address", type: "error" })
      return
    }

    // Move to step 2
    setMessage({ text: "", type: "" })
    setStep(2)
  }

  const verifyDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!txid.trim()) {
      setMessage({ text: "Please enter a transaction ID", type: "error" });
      return;
    }
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/verify-deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          txid,
          senderAddress
        }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setMessage({ text: "✅ Deposit verified successfully!", type: "success" });
        setTxid("");
        setTimeout(() => {
          setStep(1);
          setSenderAddress("");
        }, 3000);
      } else {
        setMessage({ text: data.error || "❌ Verification failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "❌ Server error during deposit", type: "error" });
    }
  };
  

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <button
        onClick={() => router.push("/home")}
        className="mb-6 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
      >
        ← Back to Home
      </button>

      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <BanknotesIcon className="w-6 h-6 text-black-600" />
          Deposit Funds
        </h1>

        {step === 1 ? (
          <>
            <p className="mb-4 text-gray-600 text-sm">
              Enter the address you'll be sending ETH from:
            </p>

            <form onSubmit={handleSenderAddressSubmit} className="space-y-4">
              <div>
                <label htmlFor="senderAddress" className="block text-sm font-medium mb-1">
                  Your Sender Address
                </label>
                <input
                  id="senderAddress"
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="0x..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:opacity-90 transition"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <p className="mb-2 text-sm text-gray-700">Send ETH to this address:</p>
              <div className="flex items-center bg-gray-50 p-2 rounded">
                <code className="flex-1 font-mono text-sm text-gray-800 overflow-x-auto">
                  {walletAddress}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-1 ml-2 rounded hover:bg-gray-200 transition"
                  title="Copy address"
                >
                  <ClipboardIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Send ETH from <span className="font-medium">{senderAddress}</span> to the address
              above, then paste your TXID below to verify:
            </p>

            <form onSubmit={verifyDeposit} className="space-y-4">
              <div>
                <label htmlFor="txid" className="block text-sm font-medium mb-1">
                  Transaction ID (TXID)
                </label>
                <input
                  id="txid"
                  type="text"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded bg-gradient-to-r from-green-600 to-green-700 text-white font-medium hover:opacity-90 transition"
                >
                  Verify Deposit
                </button>
              </div>
            </form>
          </>
        )}

        {message.text && (
          <div
            className={`mt-6 p-3 flex items-center gap-2 rounded text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>

  )
}
