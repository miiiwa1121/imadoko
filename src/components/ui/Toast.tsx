"use client";

import { X } from "lucide-react";

export type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
};

const TYPE_STYLES: Record<NonNullable<ToastProps["type"]>, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-gray-900 text-white"
};

export default function Toast({ message, type = "info", actionLabel, onAction, onClose }: ToastProps) {
  return (
    <div className="fixed top-6 left-1/2 z-[3000] w-[90%] max-w-md -translate-x-1/2">
      <div
        role="alert"
        aria-live="assertive"
        className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-xl ${TYPE_STYLES[type]}`}
      >
        <p className="text-sm font-semibold leading-relaxed">{message}</p>
        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition"
            >
              {actionLabel}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/20 transition"
              aria-label="通知を閉じる"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
