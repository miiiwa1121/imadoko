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
  const updateLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition: LatLngExpression = [latitude, longitude];
        setPosition(newPosition);

        // sessionsテーブルの該当IDの行を更新する
        const { error } = await supabase
          .from("sessions")
          .update({ lat: latitude, lng: longitude })
          .eq("id", currentShareId);

        if (error) console.error("DB更新エラー:", error);
        else console.log("DBの位置情報を更新しました");
      },
      (err) => {
        console.error(err);
        setPosition([35.681236, 139.767125]);
      }
    );
  };

  // 共有開始時にsessionsテーブルに行を追加する
  const handleShareStart = async () => {
    const newShareId = nanoid(10);
    localStorage.setItem("shareId", newShareId);
    setShareId(newShareId);

    // 新しいセッションをDBに作成
    const { error } = await supabase
      .from("sessions")
      .insert({ id: newShareId, status: "active" });

    if (error) {
      console.error("セッション作成エラー:", error);
      // エラーハンドリング（必要に応じて）
    } else {
      updateLocation(newShareId);
    }
  };

  // 共有停止時にstatusを'stopped'に更新する
  const handleShareStop = async () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (shareId) {
      // DBのセッションステータスを更新
      const { error } = await supabase
        .from("sessions")
        .update({ status: "stopped" })
        .eq("id", shareId);
      if (error) console.error("セッション停止エラー:", error);
    }

    localStorage.removeItem("shareId");
    setShareId(null);
    setPosition(null);
    setGuestPosition(null);
  };

  // localStorageからの復元ロジック
  useEffect(() => {
    const storedShareId = localStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      updateLocation(storedShareId);
    }
    setIsLoading(false);
  }, []);

  // 定期更新ロジック
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        updateLocation(shareId);
      }, 15000);
      return () => {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      };
    }
  }, [shareId]);

  // ゲスト位置情報をリアルタイムで監視
  useEffect(() => {
    if (!shareId) return;

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
          const { guest_lat, guest_lng } = payload.new as {
            guest_lat?: number;
            guest_lng?: number;
          };
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

  return {
    position,
    guestPosition,
    shareId,
    isLoading,
    handleShareStart,
    handleShareStop,
  };
}
