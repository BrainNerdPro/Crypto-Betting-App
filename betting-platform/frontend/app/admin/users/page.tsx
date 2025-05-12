"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  ArrowUturnLeftIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type User = {
  _id: string;
  username: string;
  balance: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sortField, setSortField] = useState<keyof User>("balance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const rowsPerPage = 10;

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users`, {
          headers: {
            "x-admin-token": "91f95fa792cdb9ed28a7b4044f681fa4d1e6db6d7118e0bfb68c6d24ff1538c2",
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch users");
        }

        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err: any) {
        console.error("❌ Error loading users:", err.message);
        setError(err.message);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // reset to first page on search
  }, [search, users]);

  const toggleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sorted = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const paginated = showAll
  ? sorted
  : sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <UserGroupIcon className="w-6 h-6 text-blue-600" />
          User Accounts
        </h1>
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 transition"
        >
          <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600" />
          Back to Admin Panel
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded text-sm w-full max-w-sm"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
          <ExclamationCircleIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {paginated.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b bg-gray-50">
                  <th
                    className="p-2 text-left cursor-pointer"
                    onClick={() => toggleSort("username")}
                  >
                    Username{" "}
                    {sortField === "username" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer"
                    onClick={() => toggleSort("balance")}
                  >
                    Balance{" "}
                    {sortField === "balance" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.username}</td>
                    <td className="p-2 flex items-center gap-1">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                      {user.balance} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            {/* Left: Prev/Next */}
            <div className="flex gap-2 justify-start">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || showAll}
                className={`px-4 py-1.5 text-sm rounded-full border transition ${
                  currentPage === 1 || showAll
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    p < Math.ceil(filteredUsers.length / rowsPerPage) ? p + 1 : p
                  )
                }
                disabled={
                  currentPage >= Math.ceil(filteredUsers.length / rowsPerPage) || showAll
                }
                className={`px-4 py-1.5 text-sm rounded-full border transition ${
                  currentPage >= Math.ceil(filteredUsers.length / rowsPerPage) || showAll
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                Next →
              </button>
            </div>

            {/* Center: Page info */}
            <div className="text-sm text-gray-500 text-center">
              {showAll
                ? `Showing all ${filteredUsers.length} users`
                : `Showing ${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
                    currentPage * rowsPerPage,
                    filteredUsers.length
                  )} of ${filteredUsers.length}`}
            </div>

            {/* Right: Jump to select */}
            <div className="flex items-center gap-2 justify-end">
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
                    setCurrentPage(1);
                  } else {
                    setShowAll(false);
                    setCurrentPage(Number(val));
                  }
                }}
                className="text-sm p-1 border border-gray-300 rounded"
              >
                {Array.from(
                  { length: Math.ceil(filteredUsers.length / rowsPerPage) },
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
  );
}
