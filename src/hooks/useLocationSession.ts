import { useState, useEffect, useRef } from "react";
import { LatLngExpression } from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

export const useLocationSession = () => {
  const [position, setPosition] = useState<LatLngExpression | null>(null); // ホストの位置
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null); // ゲストの位置
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // ホストの位置情報をDBに送信する関数（自分の更新のみ行う）
  const updateHostLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        // ホストの座標(lat, lng)だけを更新
        const { error } = await supabase
          .from("sessions")
          .update({
            lat: latitude,
            lng: longitude,
          })
          .eq("id", currentShareId);

        if (error) console.error("ホスト位置更新エラー:", error);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  };

  const handleShareStart = async () => {
    setIsLoading(true);
    const newShareId = nanoid(10);
    
    // セッションの初期作成
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        const { error } = await supabase.from("sessions").insert({
          id: newShareId,
          lat: latitude,
          lng: longitude,
          status: 'active',
          // ゲスト情報は最初はnull
        });

        if (error) {
          console.error("セッション作成エラー:", error);
          alert("共有の開始に失敗しました");
          setIsLoading(false);
          return;
        }

        setShareId(newShareId);
        // ローカルストレージに保存（復元用）
        if (typeof window !== "undefined") {
          localStorage.setItem("shareId", newShareId);
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

  const handleShareStop = async () => {
    if (shareId) {
      await supabase
        .from("sessions")
        .update({ status: 'stopped' })
        .eq("id", shareId);
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setShareId(null);
    setPosition(null);
    setGuestPosition(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("shareId");
    }
  };

  // 監視と定期更新のロジック
  useEffect(() => {
    if (shareId) {
      // 1. 即座に一度更新
      updateHostLocation(shareId);

      // 2. 定期的に自分の位置を更新 (10秒ごと)
      intervalIdRef.current = setInterval(() => {
        updateHostLocation(shareId);
      }, 10000);

      // 3. DBの変更を監視して、ゲストの位置(guest_lat, guest_lng)を取得
      const channel = supabase
        .channel(`session-${shareId}`)
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
            // ゲストの位置があれば更新
            if (newData.guest_lat && newData.guest_lng) {
              setGuestPosition([newData.guest_lat, newData.guest_lng]);
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

  // ページロード時の復元ロジック
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedShareId = localStorage.getItem("shareId");
      if (savedShareId) {
        setShareId(savedShareId);
      }
    }
  }, []);

  return {
    position,     // ホスト位置
    guestPosition,// ゲスト位置（追加）
    shareId,
    isLoading,
    handleShareStart,
    handleShareStop,
  };
};