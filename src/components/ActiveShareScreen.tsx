"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps } from "@/components/ShareMap";
import type { Participant, LocationErrorType } from "@/hooks/useMultiplayer";
import { Power, Copy, Check } from "lucide-react";
import Spinner from "@/components/Spinner";
import { WarningBanner } from "@/components/WarningBanner";
import { PermissionGuide } from "@/components/PermissionGuide";
import { MAP_STYLES } from "@/constants/mapStyles";
import { MapStyleSelector } from "@/components/MapStyleSelector";
import { ParticipantList } from "@/components/ParticipantList";

const ShareMap = dynamic<ShareMapProps>(() => import("@/components/ShareMap"), { ssr: false });

type Props = {
  shareId: string;
  participants: Participant[];
  myId: string | null;
  handleShareStop: () => void;
  updateMyName: (name: string) => void;
  locationError: LocationErrorType;
};

export default function ActiveShareScreen({
  shareId,
  participants,
  myId,
  handleShareStop,
  updateMyName,
  locationError
}: Props) {
  // 自分自身と他の参加者を分ける
  // UUIDと名前の両方で安全に自分自身を特定
  const me = participants.find(p => p.id === myId);
  const host = participants.find(p => p.name === "ホスト");
  
  // 自分以外の参加者のみを抽出（meが見つかった場合、そのIDを除外）
  const others = participants.filter(p => !me || p.id !== me.id);

  const [isCopied, setIsCopied] = useState(false);
  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const [mapStyleIndex, setMapStyleIndex] = useState(2);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

  if (!me?.lat || !me?.lng) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <WarningBanner shareId={shareId} />
        {locationError === "permission-denied" && <PermissionGuide />}
        <Spinner />
        <p className="mt-4 text-gray-600 font-bold">現在地を取得中...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <WarningBanner shareId={shareId} />
      {locationError === "permission-denied" && (
        <div className="absolute top-20 left-0 right-0 z-[1200]">
          <PermissionGuide />
        </div>
      )}
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
