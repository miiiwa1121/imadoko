"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps, Participant } from "@/components/ShareMap";
import { Power, Copy, Check } from "lucide-react";

const ShareMap = dynamic<ShareMapProps>(() => import("@/components/ShareMap"), { ssr: false });

type Props = {
  shareId: string;
  participants: Participant[];
  myId: string | null;
  handleShareStop: () => void;
  updateMyName: (name: string) => void;
};

export default function ActiveShareScreen({
  shareId,
  participants,
  myId,
  handleShareStop,
  updateMyName
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

  const handleEditName = () => {
    const newName = window.prompt("新しい名前を入力してください:");
    if (newName && newName.trim() !== "") {
      updateMyName(newName.trim());
    }
  };

  // 自分自身と他の参加者を分ける
  const me = participants.find(p => p.id === myId);
  const others = participants.filter(p => p.id !== myId);

  return (
    <div className="w-full h-screen relative">
      {myId && (
        <ShareMap
          participants={participants}
          myId={myId}
          focusLocation={focusLocation}
          focusKey={focusKey}
          onEditName={handleEditName}
        />
      )}

      {/* フォーカスボタン（スクロール可能リスト） */}
      <div className="absolute top-8 right-4 z-[1000] flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2 pb-2 scrollbar-hide">
        {/* 自分を最上部に固定 */}
        {me && (
          <button
            onClick={() => me.lat !== null && me.lng !== null && handleFocus([me.lat, me.lng])}
            disabled={!me.lat}
            className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 min-w-[60px]"
            title="自分の位置"
          >
            <div 
              style={{ backgroundColor: me.color }} 
              className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
            ></div>
            <p className="text-[10px] font-bold text-center truncate px-1">わたし</p>
          </button>
        )}
        
        {/* 他の参加者（最大8人表示の目安でスクロール） */}
        {others.map((p) => (
          <button
            key={p.id}
            onClick={() => p.lat !== null && p.lng !== null && handleFocus([p.lat, p.lng])}
            disabled={!p.lat}
            className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 min-w-[60px]"
            title={`${p.name}の位置`}
          >
            <div 
              style={{ backgroundColor: p.color }} 
              className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
            ></div>
            <p className="text-[10px] font-bold text-center truncate px-1 max-w-[50px]">{p.name}</p>
          </button>
        ))}
      </div>

      {/* ホスト操作パネル */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto flex items-center gap-4">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            参加者: {participants.length}人
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
              <Power size={14} /> 全員終了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
