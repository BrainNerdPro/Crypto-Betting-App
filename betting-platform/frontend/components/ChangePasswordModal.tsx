"use client";

import React, { useState } from "react";
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd)

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[\W_]/.test(pwd)) strength++
    return strength
  } 

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [status, setStatus] = useState<{ message: string; success: boolean } | null>(null);
  
  const strength = getPasswordStrength(newPassword)
  const strengthColors = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-600",
  ]
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"]

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
      setStatus({ message: "Password updated successfully.", success: true });
      setTimeout(() => {
        setStatus(null);
        onClose();
      }, 1000);
    } else {
      setStatus({ message: data.error || "Update failed.", success: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <h2 className="text-lg font-semibold mb-4 text-center">Change Admin Password</h2>

        <form onSubmit={handleChangePassword} className="space-y-4 relative">
          {/* Current Password */}
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 pr-10 border rounded text-sm"
              required
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 pr-10 border rounded text-sm"
              required
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </span>
          </div>

          {/* Strength Indicator */}
          
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full ${strengthColors[strength]} rounded-full transition-all`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Strength: <span className="font-medium">{strengthLabel[strength]}</span>
                </p>
              </div>

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
          <div className="mt-4 flex items-center gap-2 text-sm text-center justify-center">
            {status.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600" />
            )}
            <span className={status.success ? "text-green-600" : "text-red-600"}>
              {status.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
