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
  const [position, setPosition] = useState<LatLngExpression | null>(null);
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
        .select("lat, lng, status")
        .eq("id", shareId)
        .single();

      if (error || !data) {
        console.error("セッション取得エラー:", error);
        setStatus("stopped"); // エラーまたはデータがない場合は停止扱い
      } else {
        setStatus(data.status);
        if (data.lat && data.lng) {
          setPosition([data.lat, data.lng]);
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
          const { lat, lng, status } = payload.new as {
            lat: number;
            lng: number;
            status: string;
          };
          setStatus(status);
          if (lat && lng) {
            setPosition([lat, lng]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  if (!position) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>ホストからの位置情報待機中...</p>
      </div>
    );
  }
  
  return <ShareMap position={position} />;
}