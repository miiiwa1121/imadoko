"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps, Participant } from "@/components/ShareMap";
import { Power, Copy, Check } from "lucide-react";
import Spinner from "@/components/Spinner";
import { MAP_STYLES } from "@/constants/mapStyles";
import { MapStyleSelector } from "@/components/MapStyleSelector";
import { ParticipantList } from "@/components/ParticipantList";
import { WarningBanner } from "@/components/WarningBanner";

const ShareMap = dynamic<ShareMapProps>(() => import("@/components/ShareMap"), { ssr: false });

type Props = {
  shareId: string;
  participants: Participant[];
  myId: string | null;
  handleShareStop: () => void;
  updateMyName: (name: string) => void;
  gpsError: string | null;
};

export default function ActiveShareScreen({
  shareId,
  participants,
  myId,
  handleShareStop,
  updateMyName,
  gpsError
}: Props) {
  // 自分自身と他の参加者を分ける
  const me = participants.find(p => p.id === myId);
  const host = participants.find(p => p.name === "ホスト");
  const others = participants.filter(p => !me || p.id !== me.id);

  const [isCopied, setIsCopied] = useState(false);
  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const [mapStyleIndex, setMapStyleIndex] = useState(2);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert("クリップボードへのコピーに失敗しました。手動でURLをコピーしてください。");
    }
  };

  const handleFocus = useCallback((loc: LatLngExpression | null) => {
    if (loc) {
      setFocusLocation(loc);
      setFocusKey((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    const targetLat = host?.lat;
    const targetLng = host?.lng;
    if (!hasInitialFocus && targetLat != null && targetLng != null) {
      handleFocus([targetLat, targetLng]);
      setHasInitialFocus(true);
    }
  }, [host?.lat, host?.lng, hasInitialFocus, handleFocus]);

  const handleEditName = (newName: string) => {
    if (newName && newName.trim() !== "") {
      if (newName.trim() === "ホスト") {
        alert("その名前は使用できません");
        return;
      }
      updateMyName(newName.trim());
    }
  };

  if (gpsError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <p className="text-red-600 font-bold mb-4">⚠️ GPSエラー</p>
        <p className="text-gray-700">{gpsError}</p>
        <p className="text-sm text-gray-500 mt-2">設定から位置情報の利用を許可し、ページをリロードしてください。</p>
      </div>
    );
  }

  if (!me?.lat || !me?.lng) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Spinner />
        <p className="mt-4 text-gray-600 font-bold">現在地を取得中...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <WarningBanner />

      <MapStyleSelector 
        mapStyleIndex={mapStyleIndex} 
        setMapStyleIndex={setMapStyleIndex} 
        className="absolute top-12 left-4 z-[1000]"
      />

      {myId && (
        <ShareMap
          participants={participants}
          myId={myId}
          focusLocation={focusLocation}
          focusKey={focusKey}
          onEditName={handleEditName}
          tileUrl={MAP_STYLES[mapStyleIndex].url}
          tileAttribution={MAP_STYLES[mapStyleIndex].attribution}
          maxNativeZoom={MAP_STYLES[mapStyleIndex].maxNativeZoom}
        />
      )}

      <ParticipantList 
        me={me} 
        host={host} 
        others={others} 
        handleFocus={handleFocus} 
        className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 max-h-[calc(100vh-140px)]"
      />

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
