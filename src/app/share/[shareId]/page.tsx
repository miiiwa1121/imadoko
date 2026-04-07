"use client";

import { use, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";
import { WarningBanner } from "@/components/WarningBanner";
import { PermissionGuide } from "@/components/PermissionGuide";
import { SessionEndedModal } from "@/components/SessionEndedModal";
import { Power, RefreshCw } from "lucide-react";
import { LatLngExpression } from "leaflet";
import Toast, { ToastProps } from "@/components/ui/Toast";
import { MAP_STYLES } from "@/constants/mapStyles";
import { MapStyleSelector } from "@/components/MapStyleSelector";
import { ParticipantList } from "@/components/ParticipantList";

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
    updateMyName,
    stopSharing,
    joinSession,
    locationError,
    joinLeaveNotification
  } = useMultiplayer(shareId, false);

  const [toast, setToast] = useState<ToastProps | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!joinLeaveNotification) return;
    const { type, name } = joinLeaveNotification;
    const displayName = name === "ホスト" ? "ホスト" : name;
    setToast({
      message: type === "join" ? `${displayName} が参加しました` : `${displayName} が退室しました`,
      type: "info",
      onClose: () => setToast(null)
    });
  }, [joinLeaveNotification]);

  const me = participants.find(p => p.id === myId);
  const host = participants.find(p => p.name === "ホスト");
  const others = participants.filter(p => p.id !== myId && p.name !== "ホスト");

  // マップフォーカス制御
  const [focusLocation, setFocusLocation] = useState<LatLngExpression | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const [mapStyleIndex, setMapStyleIndex] = useState(2);

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

  if (sessionStatus === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <WarningBanner shareId={shareId} />
        {locationError === "permission-denied" && <PermissionGuide />}
        <Spinner />
      </div>
    );
  }

  if (sessionStatus === "stopped") {
    return <SessionEndedModal />;
  }

  // 待機中はスピナーを出すのではなく、自分のピンを含む地図を描画する
  // ({!host?.lat || !host?.lng} の早期リターンを削除)

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

      <ParticipantList
        host={host}
        me={me}
        others={others}
        handleFocus={handleFocus}
        showMeFilter={isSharing}
        className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 max-h-[calc(100vh-140px)]"
      />
      
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
      {toast && <Toast {...toast} />}
    </div>
  );
}
