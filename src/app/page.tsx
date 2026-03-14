"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Spinner from "@/components/Spinner";
import StartShareScreen from "@/components/StartShareScreen";
import ActiveShareScreen from "@/components/ActiveShareScreen";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabaseClient";
import Toast, { ToastProps } from "@/components/ui/Toast";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

type LoadingPhase = "idle" | "warming-gps" | "creating-session" | "joining-session";

const LOADING_LABELS: Record<Exclude<LoadingPhase, "idle">, { label: string; subLabel?: string }> = {
  "warming-gps": { label: "位置情報を確認中", subLabel: "許可されるまで少しお待ちください" },
  "creating-session": { label: "セッションを作成中", subLabel: "共有リンクを準備しています" },
  "joining-session": { label: "共有を開始中", subLabel: "参加者情報を同期しています" }
};

export default function Home() {
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [toast, setToast] = useState<ToastProps | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const stored = sessionStorage.getItem("hostSessionId");
    if (stored) {
      setShareId(stored);
    }

    if (typeof window !== "undefined" && navigator.geolocation) {
      setLoadingPhase("warming-gps");
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          sessionStorage.setItem("last_lat", pos.coords.latitude.toString());
          sessionStorage.setItem("last_lng", pos.coords.longitude.toString());
          setLoadingPhase("idle");
        },
        (err) => {
          console.error("GPSウォームアップ失敗", err);
          setLoadingPhase("idle");
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 5000 }
      );
    } else {
      setLoadingPhase("idle");
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const {
    participants,
    myId,
    endSessionForEveryone,
    updateMyName,
    joinSession,
    locationError
  } = useMultiplayer(shareId, true);

  const handleShareStart = async () => {
    setIsLoading(true);
    setLoadingPhase("creating-session");
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
      setLoadingPhase("joining-session");
      await joinSession(newShareId);
    } else {
      setToast({
        message: "共有の開始に失敗しました。もう一度お試しください。",
        type: "error",
        actionLabel: "再試行",
        onAction: handleShareStart,
        onClose: () => setToast(null)
      });
      setLoadingPhase("idle");
    }
    setIsLoading(false);
    if (!error) {
      setLoadingPhase("idle");
    }
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

  if (!isMounted || !shareId) {
    const overlayConfig = loadingPhase !== "idle" ? LOADING_LABELS[loadingPhase] : null;
    return (
      <div className="w-full h-screen relative">
        <ShareMap
          participants={[]} // トップ画面なので参加者は空
          myId="top-page-user" // ダミーのID
        />
        {/* 画面の上に、共有開始ボタンなどのUIを重ねる */}
        <div className="absolute inset-0 z-[1000] flex flex-col pointer-events-none">
          <StartShareScreen handleShareStart={handleShareStart} isStarting={isLoading} />
        </div>
        {overlayConfig && (
          <LoadingOverlay label={overlayConfig.label} subLabel={overlayConfig.subLabel} />
        )}
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  return (
    <>
      <ActiveShareScreen
        shareId={shareId}
        participants={participants}
        myId={myId}
        handleShareStop={handleShareStop}
        updateMyName={updateMyName}
        locationError={locationError}
      />
      {toast && <Toast {...toast} />}
    </>
  );
}
