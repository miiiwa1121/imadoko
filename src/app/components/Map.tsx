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
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("hostSessionId");
    if (stored) {
      setShareId(stored);
    }
    setIsLoading(false);
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
    
    // ホストとして新しいセッションを作成
    const { error } = await supabase.from("sessions").insert({
      id: newShareId,
      status: 'active',
      lat: null,
      lng: null
    });

    if (!error) {
      // 以前の参加情報をクリアして、新しいセッションで真っ新な状態を作れるようにする
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

  if (!shareId) {
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