"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";

// dynamic インポートに <any> を指定して型の不一致エラーを回避します
const ShareMap = dynamic<any>(() => import("@/components/ShareMap"), { ssr: false });

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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/guest/${shareId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 bg-white shadow-md z-[1000]">
        <p className="font-semibold mb-2">共有リンクが作成されました！</p>
        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {isCopied ? "コピー済み！" : "リンクをコピー"}
          </button>
          <button
            onClick={handleShareStop}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            共有を停止
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ShareMap position={position} guestPosition={guestPosition} />
      </div>
    </div>
  );
}
