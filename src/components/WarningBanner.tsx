import { X } from "lucide-react";
import { useState } from "react";

export function WarningBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[2000] bg-yellow-100/90 backdrop-blur-sm text-yellow-800 text-[11px] sm:text-xs font-bold py-2 px-8 text-center shadow-sm flex items-center justify-between">
      <div className="flex-1 flex justify-center items-center">
        ⚠️ リアルタイムで共有するには、画面を開いたままにしてください
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 p-1 hover:bg-yellow-200 rounded-full transition-colors"
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </div>
  );
}
