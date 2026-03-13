"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps } from "@/components/ShareMap";
import { Power, Copy, Check } from "lucide-react";

const ShareMap = dynamic<ShareMapProps>(() => import("@/components/ShareMap"), { ssr: false });

type Props = {
  shareId: string;
  position: LatLngExpression | null;
  guestPosition: LatLngExpression | null;
  handleShareStop: () => void;
};

export default function ActiveShareScreen({
  shareId,
  position,
  guestPosition,
  handleShareStop,
}: Props) {
  const [isCopied, setIsCopied] = useState(false);
  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFocus = (loc: LatLngExpression | null) => {
    if (loc) {
      setFocusLocation(loc);
      setFocusKey((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full h-screen relative">
      <ShareMap
        hostPosition={position}
        guestPosition={guestPosition}
        hostLabel="あなた"
        guestLabel="相手"
        focusLocation={focusLocation}
        focusKey={focusKey}
      />

      {/* フォーカスボタン */}
      <div className="absolute top-8 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => handleFocus(position)}
          disabled={!position}
          className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-3 rounded-full transition-colors disabled:opacity-50"
          title="自分の位置"
        >
          <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-1 border-2 border-white shadow-sm"></div>
          <p className="text-[10px] font-bold">あなた</p>
        </button>
        <button
          onClick={() => handleFocus(guestPosition)}
          disabled={!guestPosition}
          className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-3 rounded-full transition-colors disabled:opacity-50"
          title="相手の位置"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 mx-auto mb-1 border-2 border-white shadow-sm"></div>
          <p className="text-[10px] font-bold">相手</p>
        </button>
      </div>

      {/* ホスト操作パネル */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto flex items-center gap-4">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            あなたの位置を共有中
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`${
                isCopied ? "bg-green-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
              } px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1`}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />} 
              {isCopied ? "コピー済み" : "リンク"}
            </button>
            <button
              onClick={handleShareStop}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Power size={14} /> 停止
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
