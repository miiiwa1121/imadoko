"use client";

import { useState, useEffect, use, useMemo } from "react"; // useとuseMemoをインポート
import dynamic from "next/dynamic"; // dynamicをインポート
import { supabase } from "@/lib/supabaseClient";
import { LatLngExpression } from "leaflet";

type PageProps = {
  params: Promise<{ shareId: string }>; // paramsがPromiseであることを明記
};

export default function SharePage({ params }: PageProps) {
  // エラー修正①: useフックでparamsのPromiseを解決する
  const { shareId } = use(params);

  const [position, setPosition] = useState<LatLngExpression | null>(null);

  // エラー修正②: 地図コンポーネントを動的に読み込む
  const ShareMap = useMemo(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => (
          <div className="flex items-center justify-center h-screen">
            <p>地図を読み込んでいます...</p>
          </div>
        ),
        ssr: false, // サーバーサイドでは描画しない
      }),
    []
  );

  useEffect(() => {
    // 最初に最新の位置情報を取得する関数
    const fetchLatestLocation = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("lat, lng")
        .eq("share_id", shareId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("位置情報の取得に失敗しました:", error);
      } else if (data) {
        setPosition([data.lat, data.lng]);
      }
    };

    fetchLatestLocation();

    // Supabaseのリアルタイム機能で、DBの変更を監視する
    const channel = supabase
      .channel(`locations-channel-${shareId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "locations",
          filter: `share_id=eq.${shareId}`,
        },
        (payload) => {
          const { lat, lng } = payload.new as { lat: number; lng: number };
          setPosition([lat, lng]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareId]);

  if (!position) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>位置情報を読み込んでいます...</p>
      </div>
    );
  }

  // 動的に読み込んだShareMapコンポーネントを描画
  return <ShareMap position={position} />;
}