"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps, Participant } from "@/components/ShareMap";
import { Power, Copy, Check, Layers } from "lucide-react";
import Spinner from "@/components/Spinner";
import { WarningBanner } from "@/components/WarningBanner";

const ShareMap = dynamic<ShareMapProps>(() => import("@/components/ShareMap"), { ssr: false });

const MAP_STYLES = [
  { name: "淡色地図 (GSI)", url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", attribution: "&copy; 国土地理院", maxNativeZoom: 18 },
  { name: "OSM Japan", url: "https://tile.openstreetmap.jp/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap", maxNativeZoom: 18 },
  { name: "CARTO Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", attribution: "&copy; CARTO", maxNativeZoom: 20 },
  { name: "Esri World Imagery", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "&copy; Esri", maxNativeZoom: 18 }
];

const getThumbnail = (url: string) => {
  return url
    .replace("{s}", "a")
    .replace("{z}", "16")
    .replace("{x}", "58208")
    .replace("{y}", "25800")
    .replace("{r}", "");
};

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
  const [isMapStyleOpen, setIsMapStyleOpen] = useState(false);

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
        <Spinner />
        <p className="mt-4 text-gray-600 font-bold">現在地を取得中...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <WarningBanner shareId={shareId} />
      {/* 地図デザイン切り替えUI */}
      <div className="absolute top-12 left-4 z-[1000]">
        <button
          onClick={() => setIsMapStyleOpen(!isMapStyleOpen)}
          className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-md border border-gray-100 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="地図のデザインを変更"
        >
          <Layers size={20} />
        </button>

        {isMapStyleOpen && (
          <div className="absolute top-12 left-0 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-100 w-64">
            <p className="text-xs font-bold text-gray-500 mb-2 px-1">地図デザイン</p>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map((style, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMapStyleIndex(i);
                    setIsMapStyleOpen(false);
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all ${
                    mapStyleIndex === i 
                      ? "border-blue-500 bg-blue-50/50" 
                      : "border-transparent hover:bg-gray-100"
                  }`}
                >
                  <div 
                    className="w-full h-16 bg-gray-200 rounded-md mb-1.5 bg-cover bg-center shadow-sm border border-gray-200"
                    style={{ backgroundImage: `url(${getThumbnail(style.url)})` }}
                  />
                  <span className="text-[10px] font-bold text-gray-700 w-full text-center truncate">
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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

      {/* フォーカスボタン（スクロール可能リスト） */}
      <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 max-h-[calc(100vh-140px)]">
        {/* 自分を最上部に固定 */}
        <div className="flex flex-col gap-2 shrink-0">
          {me && (
            <button
              onClick={() => me.lat !== null && me.lng !== null && handleFocus([me.lat, me.lng])}
              disabled={!me.lat}
              className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px]"
              title="自分の位置"
            >
              <div 
                style={{ backgroundColor: me.color }} 
                className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
              ></div>
              <p className="text-[10px] font-bold text-center truncate px-1">{me.name === "ホスト" ? "ホスト" : (/^P\d+$/.test(me.name) ? "わたし" : me.name)}</p>
            </button>
          )}
        </div>
        
        {/* 他の参加者（画面が許す限り表示、超えたらスクロール） */}
        <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide pr-1 pb-2">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => p.lat !== null && p.lng !== null && handleFocus([p.lat, p.lng])}
              disabled={!p.lat}
              className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px] shrink-0"
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
