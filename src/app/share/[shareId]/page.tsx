"use client";

import { useState, useEffect, use, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { LatLngExpression } from "leaflet";
import Spinner from "@/components/Spinner";

// ShareMapを動的インポート
const ShareMap = dynamic(() => import("@/components/ShareMap"), {
  loading: () => <Spinner />,
  ssr: false,
});

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  
  const [hostPosition, setHostPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [status, setStatus] = useState<string>("active");
  
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // 1. ゲスト（自分）の位置情報を送信する関数
  const updateGuestLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGuestPosition([latitude, longitude]); // 自分の画面でも青ピンを動かす

        // ゲストのカラム(guest_lat, guest_lng)だけを更新
        // ホストのデータは触らない
        const { error } = await supabase
          .from("sessions")
          .update({
            guest_lat: latitude,
            guest_lng: longitude,
          })
          .eq("id", shareId);

        if (error) console.error("ゲスト位置送信エラー:", error);
      },
      (err) => console.error("位置情報取得エラー:", err),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // --- 初期化処理 ---
    
    // A. 最初にセッションの現在の状態（ホストの位置）を取得
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", shareId)
        .single();

      if (error) {
        console.error("データ取得失敗:", error);
      } else if (data) {
        setStatus(data.status);
        if (data.lat && data.lng) {
          setHostPosition([data.lat, data.lng]);
        }
        // 自分が過去に送ったデータがあればセットしてもいいが、
        // リアルタイム性を重視して現在地を再取得する流れにする
      }
    };
    fetchSession();

    // B. 自分の位置情報の定期送信を開始 (10秒ごと)
    updateGuestLocation(); // 初回
    intervalIdRef.current = setInterval(() => {
      updateGuestLocation();
    }, 10000);

    // C. Supabaseからの受信設定（ホストの動きを監視）
    const channel = supabase
      .channel(`share-page-${shareId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${shareId}`,
        },
        (payload) => {
          const newData = payload.new;
          setStatus(newData.status);
          
          // ホストの位置が更新されていたら反映
          if (newData.lat && newData.lng) {
            setHostPosition([newData.lat, newData.lng]);
          }
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      supabase.removeChannel(channel);
    };
  }, [shareId]);

  // 共有停止時の表示
  if (status === "stopped") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">共有終了</h1>
          <p className="text-gray-600">ホストにより位置情報の共有が停止されました。</p>
        </div>
      </div>
    );
  }

  // 地図表示
  return (
    <div className="w-full h-screen relative">
      <ShareMap hostPosition={hostPosition} guestPosition={guestPosition} />
      
      {/* ゲストへのガイダンス（オーバーレイ） */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            あなたの位置を共有中
          </p>
        </div>
      </div>
    </div>
  );
}