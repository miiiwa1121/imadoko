"use client";

import { useState, useEffect, use, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";
import { Power, RefreshCw } from "lucide-react"; // アイコン用

type PageProps = {
  params: Promise<{ shareId: string }>;
};

// DBの型定義
type SessionPayload = {
  lat?: number;
  lng?: number;
  status: string;
  [key: string]: unknown;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  const [hostPosition, setHostPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [displayStatus, setDisplayStatus] = useState<string>("loading");
  
  // ゲスト側の共有状態管理（デフォルトはON）
  const [isSharing, setIsSharing] = useState(true);
  
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const ShareMap = useMemo<React.ComponentType<ShareMapProps>>(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  // ホストの状態変化をハンドリング
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === "active") {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setDisplayStatus("active");
    } else if (newStatus === "stopped") {
      // リロード対策の猶予時間
      if (!stopTimerRef.current && displayStatus !== "stopped") {
        stopTimerRef.current = setTimeout(() => {
          setDisplayStatus("stopped");
        }, 3000);
      }
    }
  }, [displayStatus]);

  // ゲストの位置送信処理
  const updateGuestLocation = useCallback(async () => {
    // 共有OFFなら送信しない
    if (!isSharing) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGuestPosition([latitude, longitude]);
        await supabase
          .from("sessions")
          .update({ guest_lat: latitude, guest_lng: longitude })
          .eq("id", shareId);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, [shareId, isSharing]); // isSharingに依存させる

  // ゲスト側からの共有停止（ボタン用）
  const handleGuestStop = async () => {
    setIsSharing(false);
    setGuestPosition(null); // 自分の画面からも消す
    
    // DB上の自分の位置を消すAPIを呼ぶ
    await fetch("/api/guest-leave", {
      method: "POST",
      body: JSON.stringify({ shareId }),
    });
  };

  // ゲスト側からの共有再開（ボタン用）
  const handleGuestStart = () => {
    setIsSharing(true);
    // 即座に位置取得・送信をトリガー
    // ※useEffectの依存配列にisSharingが入っているため、自動的に再開もされるが、念のため
  };

  // メインの処理
  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", shareId)
        .single();

      if (error || !data) {
        setDisplayStatus("stopped");
      } else {
        setDisplayStatus(data.status);
        if (data.lat && data.lng) setHostPosition([data.lat, data.lng]);
        // 自分が再参加した場合は、自分の位置は再取得するのでここでのセットは不要だが
        // 他のゲストがいる場合は考慮が必要（今回は1対1想定なのでスキップ）
      }
    };

    fetchInitialSession();

    // 位置情報の定期送信（isSharingがtrueの時だけ機能する）
    updateGuestLocation();
    guestIntervalRef.current = setInterval(updateGuestLocation, 10000);

    // リアルタイム監視
    const channel = supabase
      .channel(`session-channel-${shareId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` },
        (payload) => {
          const newData = payload.new as SessionPayload;
          handleStatusChange(newData.status);
          if (newData.lat && newData.lng) {
            setHostPosition([newData.lat, newData.lng]);
          }
        }
      )
      .subscribe();

    return () => {
      if (guestIntervalRef.current) clearInterval(guestIntervalRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [shareId, handleStatusChange, updateGuestLocation, isSharing]);

  // タブ閉じ（pagehide）対策
  useEffect(() => {
    const handleTabClose = () => {
      // 共有中かどうかに関わらず、タブが消えるならDBの自分の位置は消しておく
      const blob = new Blob([JSON.stringify({ shareId })], { type: "application/json" });
      navigator.sendBeacon("/api/guest-leave", blob);
    };
    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [shareId]);


  // --- レンダリング ---

  if (displayStatus === "loading") return <Spinner />;

  if (displayStatus === "stopped") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">共有終了</h1>
          <p className="text-gray-600">ホストが位置情報の共有を停止しました。</p>
        </div>
      </div>
    );
  }

  if (!hostPosition) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
        <p className="ml-4 text-gray-600">ホストの位置情報を待機中...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen relative">
      <ShareMap 
        hostPosition={hostPosition} 
        // 共有中なら自分の位置を表示、停止中ならnull
        guestPosition={isSharing ? guestPosition : null}
        hostLabel="ホスト"
        guestLabel="あなた" 
      />
      
      {/* ゲスト用コントロールパネル */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto flex items-center gap-4">
          {isSharing ? (
            <>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                あなたの位置を共有中
              </p>
              <button 
                onClick={handleGuestStop}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Power size={14} />
                停止
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                位置情報の共有を停止中
              </p>
              <button 
                onClick={handleGuestStart}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
              >
                <RefreshCw size={14} />
                再開
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}