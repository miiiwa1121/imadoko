"use client";

import { use, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";
import { Power, RefreshCw, Layers } from "lucide-react";
import { LatLngExpression } from "leaflet";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

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

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  
  const { 
    participants, 
    myId, 
    sessionStatus, 
    isSharing, 
    updateMyName, 
    stopSharing,
    joinSession
  } = useMultiplayer(shareId, false);

  const me = participants.find(p => p.id === myId);
  const host = participants.find(p => p.name === "ホスト");
  const others = participants.filter(p => p.id !== myId && p.name !== "ホスト");

  // マップフォーカス制御
  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const [mapStyleIndex, setMapStyleIndex] = useState(0);
  const [isMapStyleOpen, setIsMapStyleOpen] = useState(false);

  // ゲストの場合も、初期表示でホスト（または自分）にフォーカス
  useEffect(() => {
    const targetLat = host?.lat ?? me?.lat;
    const targetLng = host?.lng ?? me?.lng;
    if (!hasInitialFocus && targetLat != null && targetLng != null) {
      handleFocus([targetLat, targetLng]);
      setHasInitialFocus(true);
    }
  }, [host?.lat, host?.lng, me?.lat, me?.lng, hasInitialFocus]);

  const handleFocus = (loc: LatLngExpression | null) => {
    if (loc) {
      setFocusLocation(loc);
      setFocusKey((prev) => prev + 1);
    }
  };

  const handleEditName = (newName: string) => {
    if (newName && newName.trim() !== "") {
      if (newName.trim() === "ホスト") {
        alert("その名前は使用できません");
        return;
      }
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

  // 待機中はスピナーを出すのではなく、自分のピンを含む地図を描画する
  // ({!host?.lat || !host?.lng} の早期リターンを削除)

  return (
    <div className="w-full h-screen relative">
      {/* 地図デザイン切り替えUI */}
      <div className="absolute top-4 left-4 z-[1000]">
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

      {(myId || participants.length > 0) && (
        <ShareMap 
          participants={participants}
          myId={myId || ""}
          focusLocation={focusLocation}
          focusKey={focusKey}
          onEditName={handleEditName}
          tileUrl={MAP_STYLES[mapStyleIndex].url}
          tileAttribution={MAP_STYLES[mapStyleIndex].attribution}
          maxNativeZoom={MAP_STYLES[mapStyleIndex].maxNativeZoom}
        />
      )}

      {/* ホスト位置取得中の表示 */}
      {(!host?.lat || !host?.lng) && (
        <div className="absolute top-4 left-16 z-[1000] bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold text-gray-600">ホストを待機中...</span>
        </div>
      )}

      {/* フォーカスボタン（スクロール可能リスト） */}
      <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 max-h-[calc(100vh-140px)]">
        {/* ホスト＆自分を最上部に固定 */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* ホスト */}
          {host && (
            <button
              onClick={() => host.lat !== null && host.lng !== null && handleFocus([host.lat, host.lng])}
              disabled={!host.lat}
              className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px]"
              title="ホストの位置"
            >
              <div 
                style={{ backgroundColor: host.color }} 
                className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
              ></div>
              <p className="text-[10px] font-bold text-center truncate px-1">ホスト</p>
            </button>
          )}

          {/* 自分 */}
          {me && isSharing && (
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
              <p className="text-[10px] font-bold text-center truncate px-1">{/^P\d+$/.test(me.name) ? "わたし" : me.name}</p>
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
