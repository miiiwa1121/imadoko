"use client";

import { useState, useEffect } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { nanoid } from "nanoid";
import Spinner from "@/components/Spinner";
import StartShareScreen from "@/components/StartShareScreen";
import ActiveShareScreen from "@/components/ActiveShareScreen";
import { supabase } from "@/lib/supabaseClient";

export default function Map() {
  const [shareId, setShareId] = useState<string | null>(null);
  // ★変更：最初はローディングにしない（即座にスタート画面を出すため）
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = sessionStorage.getItem("hostSessionId");
    if (stored) {
      setShareId(stored);
    }
  }, []);

  const {
    participants,
    myId,
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

  if (isLoading) return <Spinner />;

  // ★変更：サーバー側での描画時、またはshareIdが無い場合は即座にスタート画面を出す
  if (!isMounted || !shareId) {
    return <StartShareScreen handleShareStart={handleShareStart} />;
  }

  return (
    <ActiveShareScreen
      shareId={shareId}
      participants={participants}
      myId={myId}
      handleShareStop={handleShareStop}
      updateMyName={updateMyName}
    />
  );
}