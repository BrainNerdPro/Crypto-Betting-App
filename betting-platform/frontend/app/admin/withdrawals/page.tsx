  "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  WalletIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);

type Withdrawal = {
  _id: string;
  username: string;
  wallet_address: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  timestamp: string;
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filterUsername, setFilterUsername] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWallet, setFilterWallet] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Withdrawal | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const rowsPerPage = 10;
  const router = useRouter();

  // ✅ Protect page (admin-only)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.isAdmin) router.push("/home");
    } catch {
      router.push("/login");
    }
  }, []);

  const fetchWithdrawals = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/withdrawals`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) setWithdrawals(data);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/withdrawals/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Withdrawal approved");
      fetchWithdrawals();
    } else {
      alert(`❌ ${data.error || "Failed to approve"}`);
    }
  };

  const rejectWithdrawal = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/withdrawals/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("❌ Withdrawal rejected and refunded");
      fetchWithdrawals();
    } else {
      alert(`❌ ${data.error || "Failed to reject"}`);
    }
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

  useEffect(() => {
    fetchWithdrawals();
    socket.on("withdrawal:update", fetchWithdrawals);
    return () => {
      socket.off("withdrawal:update", fetchWithdrawals);
    };
  }, []);

    return (     
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <BanknotesIcon className="w-6 h-6 text-blue-600" />
          Withdrawal Requests
        </h1>
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 transition"
        >
          <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600" />
          Back to Admin Panel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        {/* Username */}
        <div className="md:col-span-2 flex flex-col">
          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <UserIcon className="w-4 h-4 text-gray-500" />
            Username
          </label>
          <input
            type="text"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="e.g. johndoe"
            className="p-2 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Wallet */}
        <div className="md:col-span-2 flex flex-col">
          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <WalletIcon className="w-4 h-4 text-gray-500" />
            Wallet
          </label>
          <input
            type="text"
            value={filterWallet}
            onChange={(e) => setFilterWallet(e.target.value)}
            placeholder="0x..."
            className="p-2 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Status */}
        <div className="md:col-span-1 flex flex-col">
          <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
            Status
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
            onClick={() => {
              setFilterUsername("");
              setFilterWallet("");
              setFilterStatus("");
            }}
            className="text-xs px-3 py-2 h-[40px] border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition w-full flex items-center justify-center gap-1"
          >
            <TrashIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

        {withdrawals.length === 0 ? (
        <p className="text-gray-500">No withdrawals found.</p>
        ) : (
          <>
          <div className="overflow-x-auto max-w-full border rounded max-h-[60vh] shadow-md">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left cursor-pointer" onClick={() => toggleSort("username")}>Username {sortBy === "username" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => toggleSort("wallet_address")}>Wallet {sortBy === "wallet_address" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => toggleSort("amount")}>Amount {sortBy === "amount" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th className="p-2 text-left cursor-pointer" onClick={() => toggleSort("status")}>Status {sortBy === "status" && (sortOrder === "asc" ? "▲" : "▼")} </th>
                  <th className="p-2 text-left cursor-pointer">Action</th>
                </tr>
              </thead>
              <tbody>
                {(showAll
                  ? sortedWithdrawals
                  : sortedWithdrawals.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                ) 
                .filter(w =>
                  (filterUsername === "" || w.username.toLowerCase().includes(filterUsername.toLowerCase())) &&
                  (filterWallet === "" || w.wallet_address.toLowerCase().includes(filterWallet.toLowerCase())) &&
                  (filterStatus === "" || w.status === filterStatus)
                ).map(w => (
                  <tr key={w._id} className="bg-white border rounded shadow-sm hover:shadow-md transition-shadow">
                    <td className="p-2">{w.username}</td>
                    <td className="p-2 flex items-center gap-2">
                    <span className="font-mono">{`${w.wallet_address.slice(0, 6)}...${w.wallet_address.slice(-4)}`}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(w.wallet_address);
                            setCopiedId(w._id);
                            setTimeout(() => setCopiedId(null), 1000);
                          }}
                          className="p-1 rounded hover:bg-gray-100 transition"
                          title="Copy address"
                        >
                          {copiedId === w._id ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                    </td>
                    <td className="p-2">{w.amount}  ETH</td>
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
                    <td className="p-2">
                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveWithdrawal(w._id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        >
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(w._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {w.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600">Paid</span>
                      </div>
                    )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>          
          
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
    )
  }
