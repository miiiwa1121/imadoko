"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import { Button } from "@/components/ui/button";

const ShareMap = dynamic(() => import("@/components/ShareMap"), { ssr: false });

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
          <Button onClick={handleCopyLink}>{isCopied ? "コピー済み！" : "リンクをコピー"}</Button>
          <Button variant="destructive" onClick={handleShareStop}>
            共有を停止
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <ShareMap position={position} guestPosition={guestPosition} />
      </div>
    </div>
  );
}
