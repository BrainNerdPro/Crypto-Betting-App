"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"
import { 
  BanknotesIcon, 
  ClipboardDocumentListIcon , 
  CheckCircleIcon, 
  ClockIcon,
  ClipboardDocumentIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon } from "@heroicons/react/24/outline";


type Withdrawal = {
  _id: string;
  wallet_address: string;
  amount: number;
  status: string;
  timestamp: string;
};


export default function WithdrawPage() {
  const [username, setUsername] = useState("")
  const [balance, setBalance] = useState(0) 
  const [walletAddress, setWalletAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" })
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<keyof Withdrawal | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showAll, setShowAll] = useState(false);

  const rowsPerPage = 10;
  
  const router = useRouter()
  

  useEffect(() => {
    const socket = io("http://localhost:5000"); // adjust if deployed

    const storedUsername = localStorage.getItem("username");

    if (!storedUsername) {
      router.push("/login");
      return;
    }

    const fetchBalance = async (user: string) => {
      const res = await fetch(`http://localhost:5000/api/user/balance/${user}`);
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        localStorage.setItem("balance", data.balance.toString());
      }
    };
    
    setUsername(storedUsername);
    fetchBalance(storedUsername);
    fetchWithdrawalHistory(storedUsername);
    
    // 🔁 Real-time update listener
    socket.on("withdrawal:update", () => {    
      fetchBalance(storedUsername);
      fetchWithdrawalHistory(storedUsername);
    });

    return () => {
      socket.off("withdrawal:update");
      //socket.disconnect();
    };

    
  }, [router, username])


  const requestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const withdrawAmount = Number.parseFloat(amount);
  
    if (!walletAddress.trim()) {
      setMessage({ text: "Please enter a wallet address", type: "error" });
      return;
    }

    // Validate the address format (basic check for Ethereum address)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setMessage({ text: "Please enter a valid wallet address", type: "error" })
      return
    }
  
    if (isNaN(withdrawAmount) || withdrawAmount <= 0 || withdrawAmount > balance) {
      setMessage({ text: "Please enter a valid amount", type: "error" });
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          wallet_address: walletAddress,
          amount: withdrawAmount,
        }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setMessage({ text: data.message || "Withdrawal submitted", type: "success" });
        setWalletAddress("");
        setAmount("");
        setBalance(data.balance); // update the balance shown
        localStorage.setItem("balance", data.balance.toString());
      } else {
        setMessage({ text: data.error || "Something went wrong", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server error", type: "error" });
    }
  };

  const fetchWithdrawalHistory = async (username: string) => {
    const res = await fetch(`http://localhost:5000/api/withdrawals/${username}`);
    const data = await res.json();
    if (Array.isArray(data)) setWithdrawals(data);
  };

  const toggleSort = (column: keyof Withdrawal) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
  
  

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => router.push("/home")}
        className="mb-6 px-4 py-2 border border-gray-300 rounded"
      >
        Back to Home
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Withdraw Funds */}
        <div className="lg:w-1/2 border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BanknotesIcon className="w-6 h-6 text-black-600" />
          Withdraw Funds
        </h1>


          <p className="mb-6 text-sm text-gray-700">
            Current Balance:{" "}
            <span className="font-bold text-green-600">{balance} ETH</span>
          </p>

          <form onSubmit={requestWithdrawal} className="space-y-4">
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium mb-1">
                Wallet Address
              </label>
              <input
                id="walletAddress"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="0x..."
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Amount to Withdraw
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                min="0"
                max={balance}
                step="0.00001"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:opacity-90 transition"
            >
              Request Withdrawal
            </button>
          </form>

          {message.text && (
            <div
              className={`mt-4 p-2 rounded text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 flex items-center gap-1">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            Withdrawals are processed manually within 24h.
          </p>
        </div>

        {/* Withdrawal History */}
        <div className="lg:w-1/2 border border-gray-300 rounded p-6 shadow-sm bg-white">
        <h2 className="text-md font-semibold mb-4 flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-black-600" />
          Withdrawal History
        </h2>
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-sm">No withdrawal requests yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Status Filter */}
                <div className="md:col-span-3 flex flex-col">
                  <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
                    Filter by Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Clear Button */}
                <div className="md:col-span-1 flex items-end">
                  <button
                    onClick={() => setFilterStatus("")}
                    className="text-xs px-3 py-2 h-[40px] border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition w-full flex items-center justify-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[60vh] border rounded">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="text-gray-600 bg-gray-50 text-left text-sm uppercase font-medium tracking-wide">
                      <th className="p-2 cursor-pointer" onClick={() => toggleSort("wallet_address")}>
                        Wallet {sortBy === "wallet_address" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-2 cursor-pointer" onClick={() => toggleSort("amount")}>
                        Amount {sortBy === "amount" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-2 cursor-pointer" onClick={() => toggleSort("status")}>
                        Status {sortBy === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-2 cursor-pointer" onClick={() => toggleSort("timestamp")}>
                        Date {sortBy === "timestamp" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAll
                      ? sortedWithdrawals
                      : sortedWithdrawals.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    )
                        .filter(w =>
                        (filterStatus === "" || w.status === filterStatus)
                      )
                      .map((w) => (
                        <tr
                          key={w._id}
                          className="bg-white border rounded shadow-sm hover:bg-gray-50 transition"
                        >
                          <td className="p-2 font-mono flex items-center gap-1">
                            <span>{w.wallet_address.slice(0, 6)}...{w.wallet_address.slice(-4)}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(w.wallet_address)
                                setCopiedId(w._id)
                                setTimeout(() => setCopiedId(null), 1000)
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition"
                              title="Copy address"
                            >
                              {copiedId === w._id ? (
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </td>
                          <td className="p-2">{w.amount} ETH</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                w.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : w.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-2 text-gray-600">{new Date(w.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left side: Prev/Next buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || showAll}
                    className={`px-4 py-1.5 text-sm rounded-full border transition ${
                      currentPage === 1 || showAll
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        p < Math.ceil(withdrawals.length / rowsPerPage) ? p + 1 : p
                      )
                    }
                    disabled={currentPage >= Math.ceil(withdrawals.length / rowsPerPage) || showAll}
                    className={`px-4 py-1.5 text-sm rounded-full border transition ${
                      currentPage >= Math.ceil(withdrawals.length / rowsPerPage) || showAll
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Next →
                  </button>
                </div>

                {/* Center: Page X of Y */}
                <p className="text-sm text-gray-500">
                {showAll
                  ? `All ${withdrawals.length} withdrawals`
                  : `Page ${currentPage} of ${Math.ceil(withdrawals.length / rowsPerPage)}`}
                </p>

                {/* Right side: Jump to page */}
                <div className="flex items-center gap-2">
                  <label htmlFor="jump" className="text-sm text-gray-600">
                    Jump to:
                  </label>
                  <select
                    id="jump"
                    value={showAll ? "all" : currentPage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "all") {
                        setShowAll(true);
                        setCurrentPage(1); // fallback to first page
                      } else {
                        setShowAll(false);
                        setCurrentPage(Number(val));
                      }
                    }}
                    className="text-sm p-1 border border-gray-300 rounded"
                  >
                    {Array.from(
                      { length: Math.ceil(withdrawals.length / rowsPerPage) },
                      (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Page {i + 1}
                        </option>
                      )
                    )}
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

  )
}
