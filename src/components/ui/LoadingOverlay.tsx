"use client";

import Spinner from "@/components/Spinner";

type LoadingOverlayProps = {
  label: string;
  subLabel?: string;
};

export default function LoadingOverlay({ label, subLabel }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-[1500] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="bg-white/90 border border-gray-100 shadow-lg rounded-2xl px-6 py-5 flex flex-col items-center gap-3">
        <div className="w-12 h-12">
          <Spinner />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">{label}</p>
          {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}
