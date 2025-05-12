// components/Alert.tsx
"use client";
import { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

type AlertProps = {
  type: "success" | "error";
  message: string;
  duration?: number; // in milliseconds
  onDismiss?: () => void;
};

export default function Alert({ type, message, duration = 3000, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`flex items-center gap-2 rounded p-3 text-sm transition-all duration-500 ease-in-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
        ${type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
      `}
    >
      {type === "success" ? (
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
      ) : (
        <XCircleIcon className="w-5 h-5 text-red-600" />
      )}
      <span>{message}</span>
    </div>
  );
}
