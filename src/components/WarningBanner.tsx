"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function WarningBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("warningBannerDismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    sessionStorage.setItem("warningBannerDismissed", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`absolute top-0 left-0 right-0 z-[2000] bg-yellow-100/90 backdrop-blur-sm text-yellow-800 text-[11px] sm:text-xs font-bold py-2 px-8 text-center shadow-sm flex items-center justify-between transition-opacity duration-300 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex-1 flex justify-center items-center">
        ⚠️ リアルタイムで共有するには、画面を開いたままにしてください
      </div>
      <button 
        onClick={handleClose}
        className="absolute right-4 p-1 hover:bg-yellow-200 rounded-full transition-colors"
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </div>
  );
}
