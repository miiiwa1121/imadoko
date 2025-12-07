import { useState, useEffect, useRef } from "react";
import { LatLngExpression } from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

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

        // ▼ 変更点: 位置更新と同時に status='active' も念のため更新しておく（リロード復帰対策）
        const { error } = await supabase
          .from("sessions")
          .update({ 
            lat: latitude, 
            lng: longitude,
            status: 'active' // 常にアクティブであることを主張する
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
    // ... (位置情報取得とDBインサート処理は前回と同じ) ...
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
          if (typeof window !== "undefined") {
            localStorage.setItem("shareId", newShareId);
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

  // 「ボタンで」停止した時だけ、ローカルストレージを消す
  const handleShareStop = async () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (shareId) {
      await supabase.from("sessions").update({ status: "stopped" }).eq("id", shareId);
    }
    localStorage.removeItem("shareId"); // ★ボタン停止の時だけ消す
    setShareId(null);
    setPosition(null);
    setGuestPosition(null);
  };

  // ▼▼▼ 自動停止ロジック（タブ閉じ対策） ▼▼▼
  useEffect(() => {
    const handleTabClose = () => {
      if (shareId) {
        // APIに「停止」信号を送るが、ローカルストレージは消さない
        const blob = new Blob([JSON.stringify({ shareId })], { type: "application/json" });
        navigator.sendBeacon("/api/stop-sharing", blob);
      }
    };

    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [shareId]);

  // ▼▼▼ 復元ロジック（リロード対策） ▼▼▼
  useEffect(() => {
    const storedShareId = localStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      // リロード直後、即座に「私はアクティブです！」とDBを更新して、
      // pagehideで送られたかもしれない「停止」信号を上書きする
      updateHostLocation(storedShareId);
    }
    setIsLoading(false);
  }, []);

  // 定期更新と監視（変更なし）
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        updateHostLocation(shareId);
      }, 15000); // 15秒間隔

      const channel = supabase
        .channel(`session-${shareId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` }, (payload) => {
             const newData = payload.new;
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