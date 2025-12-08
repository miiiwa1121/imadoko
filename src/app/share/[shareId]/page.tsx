"use client";

import { useState, useEffect, use, useMemo, useRef, useCallback } from "react"; // useCallbackを追加
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

// 型定義を追加
type SessionPayload = {
  lat?: number;
  lng?: number;
  status: string;
  [key: string]: unknown;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  // ... (state定義はそのまま) ...
  const [hostPosition, setHostPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [displayStatus, setDisplayStatus] = useState<string>("loading");
  
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

  // ▼ 変更: useCallback で囲む
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === "active") {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setDisplayStatus("active");
    } else if (newStatus === "stopped") {
      if (!stopTimerRef.current && displayStatus !== "stopped") {
        stopTimerRef.current = setTimeout(() => {
          setDisplayStatus("stopped");
        }, 3000);
      }
    }
  }, [displayStatus]); // 依存配列に追加

  // ▼ 変更: useCallback で囲む
  const updateGuestLocation = useCallback(async () => {
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
  }, [shareId]); // 依存配列に追加

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
        if (data.guest_lat && data.guest_lng) setGuestPosition([data.guest_lat, data.guest_lng]);
      }
    };

    fetchInitialSession();
    updateGuestLocation();
    guestIntervalRef.current = setInterval(updateGuestLocation, 10000);

    const channel = supabase
      .channel(`session-channel-${shareId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` },
        (payload) => {
          // ▼ 変更: as any をやめて型をつける
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
  }, [shareId, handleStatusChange, updateGuestLocation]); // 依存配列に関数を追加

  // ... (return以下はそのまま) ...
  if (displayStatus === "loading") return <Spinner />;
  // ...
  if (displayStatus === "stopped") {
    // ...
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
    // ...
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
        guestPosition={guestPosition}
        hostLabel="ホスト"
        guestLabel="あなた" 
      />
    </div>
  );
}