import { useState, useEffect, useRef } from "react";
import { LatLngExpression } from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

// 型定義を追加
type SessionPayload = {
  guest_lat?: number;
  guest_lng?: number;
  [key: string]: unknown; // 他のフィールドも許容
};

export function useLocationSession() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // 位置情報をDBに更新する関数
  const updateHostLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        // ステータスを 'active' に上書きし続ける（リロード復帰用）
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
          // ★変更: sessionStorageを使う（タブを閉じると消えるが、リロードでは残る）
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
        setIsLoading(false);
      }
    );
  };

  const handleShareStop = async () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (shareId) {
      await supabase.from("sessions").update({ status: "stopped" }).eq("id", shareId);
    }
    // ★変更: sessionStorageから削除
    sessionStorage.removeItem("shareId");
    setShareId(null);
    setPosition(null);
    setGuestPosition(null);
  };

  // タブを閉じる（またはリロード）直前の処理
  useEffect(() => {
    const handleTabClose = () => {
      if (shareId) {
        // APIに「停止」信号を送る
        const blob = new Blob([JSON.stringify({ shareId })], { type: "application/json" });
        navigator.sendBeacon("/api/stop-sharing", blob);
      }
    };

    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [shareId]);

  // 復元ロジック（リロード対策）
  useEffect(() => {
    // sessionStorageから復元
    const storedShareId = sessionStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      // リロード直後、即座に「active」で上書きして停止信号を打ち消す
      updateHostLocation(storedShareId);
    }
    setIsLoading(false);
  }, []);

  // 定期更新
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        updateHostLocation(shareId);
      }, 15000);

      const channel = supabase
        .channel(`session-${shareId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` }, (payload) => {
             const newData = payload.new as SessionPayload;
             if (newData.guest_lat && newData.guest_lng) {
               setGuestPosition([newData.guest_lat, newData.guest_lng]);
             }
        })
        .subscribe();

      return () => {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        supabase.removeChannel(channel);
      };
    }
  }, [shareId]);

  return { position, guestPosition, shareId, isLoading, handleShareStart, handleShareStop };
}