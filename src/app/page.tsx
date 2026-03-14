"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Spinner from "@/components/Spinner";
import StartShareScreen from "@/components/StartShareScreen";
import ActiveShareScreen from "@/components/ActiveShareScreen";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const stored = sessionStorage.getItem("hostSessionId");
    if (stored) {
      setShareId(stored);
    }

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          sessionStorage.setItem("last_lat", pos.coords.latitude.toString());
          sessionStorage.setItem("last_lng", pos.coords.longitude.toString());
        },
        (err) => { 
          console.error("GPSウォームアップ失敗", err); 
          setGpsError("位置情報の取得に失敗しました。"); // エラーメッセージを設定
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 5000 }
      );
    }
  }, []);

  const {
    participants,
    myId,
    gpsError: multiplayerGpsError,
    endSessionForEveryone,
    updateMyName,
    joinSession
  } = useMultiplayer(shareId, true);

  const handleShareStart = async () => {
    setIsLoading(true);
    const newShareId = nanoid(10);
    
    const { error } = await supabase.from("sessions").insert({
      id: newShareId,
      status: 'active',
      lat: null,
      lng: null
    });

    if (!error) {
      sessionStorage.removeItem(`participantId-${newShareId}`);
      sessionStorage.setItem("hostSessionId", newShareId);
      setShareId(newShareId);
      await joinSession(newShareId);
    } else {
      alert("エラーが発生しました: " + error.message);
    }
    setIsLoading(false);
  };

  const handleShareStop = async () => {
    await endSessionForEveryone();
    sessionStorage.removeItem("hostSessionId");
    setShareId(null);
  };

  // 最強の共通地図コンポーネントを呼び出す
  const ShareMap = useMemo(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  if (isLoading) return <Spinner />;

  if (!isMounted || !shareId) {
    return (
      <div className="w-full h-screen relative">
        <ShareMap
          participants={[]} // トップ画面なので参加者は空
          myId="top-page-user" // ダミーのID
        />
        {/* 画面の上に、共有開始ボタンなどのUIを重ねる */}
        <div className="absolute inset-0 z-[1000] flex flex-col pointer-events-none">
          <StartShareScreen handleShareStart={handleShareStart} />
        </div>
      </div>
    );
  }

  return (
    <ActiveShareScreen
      shareId={shareId}
      participants={participants}
      myId={myId}
      gpsError={multiplayerGpsError || gpsError}
      handleShareStop={handleShareStop}
      updateMyName={updateMyName}
    />
  );
}
