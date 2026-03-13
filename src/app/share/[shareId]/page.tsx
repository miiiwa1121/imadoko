"use client";

import { use, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";
import { Power, RefreshCw } from "lucide-react";
import { LatLngExpression } from "leaflet";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  
  const { 
    participants, 
    myId, 
    sessionStatus, 
    isSharing, 
    setIsSharing, 
    updateMyName, 
    stopSharing,
    joinSession
  } = useMultiplayer(shareId, false);

  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);

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

  const ShareMap = useMemo<React.ComponentType<ShareMapProps>>(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  if (sessionStatus === "loading") return <Spinner />;

  if (sessionStatus === "stopped") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">共有終了</h1>
          <p className="text-gray-600">ホストが位置情報の共有を停止しました。</p>
        </div>
      </div>
    );
  }

  const me = participants.find(p => p.id === myId);
  const others = participants.filter(p => p.id !== myId);

  return (
    <div className="w-full h-screen relative">
      {(myId || participants.length > 0) && (
        <ShareMap 
          participants={participants}
          myId={myId || ""}
          focusLocation={focusLocation}
          focusKey={focusKey}
          onEditName={handleEditName}
        />
      )}

      {/* フォーカスボタン（スクロール可能リスト） */}
      <div className="absolute top-8 right-4 z-[1000] flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2 pb-2 scrollbar-hide">
        {/* 自分を最上部に固定 */}
        {me && isSharing && (
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
      
      {/* ゲスト操作パネル */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto flex items-center gap-4">
          {isSharing ? (
            <>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                あなたの位置を共有中
              </p>
              <button onClick={stopSharing} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1">
                <Power size={14} /> 退室
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                位置情報の共有を停止中
              </p>
              <button 
                onClick={() => joinSession(shareId)} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
              >
                <RefreshCw size={14} /> 参加
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
