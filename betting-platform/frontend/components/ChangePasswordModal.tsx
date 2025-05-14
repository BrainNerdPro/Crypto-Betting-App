"use client";

import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<{ message: string; success: boolean } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus({ message: "✅ Password updated successfully.", success: true });
      setTimeout(() => {
        setStatus(null);
        onClose();
      }, 1000);
    } else {
      setStatus({ message: "❌ " + (data.error || "Update failed."), success: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <h2 className="text-lg font-semibold mb-4 text-center">Change Admin Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm border rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
        {status && (
          <p
            className={`mt-3 text-sm text-center ${
              status.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
