import { useState, useEffect, useRef } from "react";
import { LatLngExpression } from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

// DBからのペイロードの型定義
type SessionPayload = {
  guest_lat?: number | null;
  guest_lng?: number | null;
  [key: string]: unknown;
};

export function useLocationSession() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // ホスト位置更新 & ステータス維持
  const updateHostLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        // リロード復帰直後などに stopped にならないよう active を上書きし続ける
        const { error } = await supabase
          .from("sessions")
          .update({ 
            lat: latitude, 
            lng: longitude,
            status: 'active' 
          })
          .eq("id", currentShareId);

        if (error) console.error("DB更新エラー:", error);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  };

  // 共有開始
  const handleShareStart = async () => {
    const newShareId = nanoid(10);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        const { error } = await supabase.from("sessions").insert({
          id: newShareId,
          lat: latitude,
          lng: longitude,
          status: 'active',
        });

        if (!error) {
          setShareId(newShareId);
          // ★修正: sessionStorageを使用（タブ閉じで消え、リロードで残る）
          if (typeof window !== "undefined") {
            sessionStorage.setItem("shareId", newShareId);
          }
        } else {
            console.error("開始エラー", error);
            alert("エラーが発生しました");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        alert("位置情報の取得に失敗しました");
        setIsLoading(false);
      }
    );
  };

  // 共有停止（ボタン操作）
  const handleShareStop = async () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (shareId) {
      await supabase.from("sessions").update({ status: "stopped" }).eq("id", shareId);
    }
    sessionStorage.removeItem("shareId");
    setShareId(null);
    setPosition(null);
    setGuestPosition(null);
  };

  // タブ閉じ（自動停止）対策
  useEffect(() => {
    const handleTabClose = () => {
      if (shareId) {
        // サーバーに停止信号を送る
        const blob = new Blob([JSON.stringify({ shareId })], { type: "application/json" });
        navigator.sendBeacon("/api/stop-sharing", blob);
      }
    };
    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [shareId]);

  // リロード復帰ロジック
  useEffect(() => {
    // ★修正: sessionStorageから復元
    const storedShareId = sessionStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      updateHostLocation(storedShareId); // 即座に生存報告
    }
    setIsLoading(false);
  }, []);

  // 定期更新 & ゲスト監視
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        updateHostLocation(shareId);
      }, 15000);

      const channel = supabase
        .channel(`session-${shareId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` },
          (payload) => {
            const newData = payload.new as SessionPayload;
            
            // ★修正: ゲスト位置がある場合のみセット、無ければ(null)消す
            if (newData.guest_lat && newData.guest_lng) {
              setGuestPosition([newData.guest_lat, newData.guest_lng]);
            } else {
              setGuestPosition(null); // これで青ピンが消えます
            }
          }
        )
        .subscribe();

      return () => {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        supabase.removeChannel(channel);
      };
    }
  }, [shareId]);

  return { position, guestPosition, shareId, isLoading, handleShareStart, handleShareStop };
}