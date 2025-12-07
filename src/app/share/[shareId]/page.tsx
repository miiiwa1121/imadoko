"use client";

import { useState, useEffect, use, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { LatLngExpression } from "leaflet";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  const [hostPosition, setHostPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [status, setStatus] = useState<string>("loading"); // 'loading', 'active', 'stopped'

  const ShareMap = useMemo<React.ComponentType<ShareMapProps>>(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  useEffect(() => {
    // 最初にセッション情報を取得
    const fetchInitialSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("lat, lng, guest_lat, guest_lng, status")
        .eq("id", shareId)
        .single();

      if (error || !data) {
        console.error("セッション取得エラー:", error);
        setStatus("stopped"); // エラーまたはデータがない場合は停止扱い
      } else {
        setStatus(data.status);
        if (data.lat && data.lng) {
          setHostPosition([data.lat, data.lng]);
        }
        if (data.guest_lat && data.guest_lng) {
          setGuestPosition([data.guest_lat, data.guest_lng]);
        }
      }
    };

    fetchInitialSession();

    // リアルタイムでセッションの更新を監視
    const channel = supabase
      .channel(`session-channel-${shareId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${shareId}`,
        },
        (payload) => {
          const { lat, lng, guest_lat, guest_lng, status } = payload.new as {
            lat: number;
            lng: number;
            guest_lat?: number;
            guest_lng?: number;
            status: string;
          };
          setStatus(status);
          if (lat && lng) {
            setHostPosition([lat, lng]);
          }
          if (guest_lat && guest_lng) {
            setGuestPosition([guest_lat, guest_lng]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareId]);

  // ゲストの位置情報を更新する関数
  useEffect(() => {
    const updateGuestLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setGuestPosition([latitude, longitude]);

          // DBにゲストの位置情報を保存
          const { error } = await supabase
            .from("sessions")
            .update({ guest_lat: latitude, guest_lng: longitude })
            .eq("id", shareId);

          if (error) console.error("ゲスト位置情報DB更新エラー:", error);
          else console.log("ゲストの位置情報を更新しました");
        },
        (err) => {
          console.error("位置情報取得エラー:", err);
        }
      );
    };

    // 初回取得
    updateGuestLocation();

    // 15秒ごとに更新
    const intervalId = setInterval(updateGuestLocation, 15000);

    return () => clearInterval(intervalId);
  }, [shareId]);

  if (status === "loading") {
    return <Spinner />;
  }

  if (status === "stopped") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-700">ホストが位置情報の共有を停止しました。</p>
      </div>
    );
  }

  // statusが'active'の場合
  if (!hostPosition) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>ホストからの位置情報待機中...</p>
      </div>
    );
  }
  
  return <ShareMap hostPosition={hostPosition} guestPosition={guestPosition} />;
}