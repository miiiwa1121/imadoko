import { useState, useEffect, useRef, useCallback } from "react";
import { LatLngExpression } from "leaflet";
import { supabase } from "@/lib/supabaseClient";

type SessionPayload = {
  lat?: number;
  lng?: number;
  status: string;
  [key: string]: unknown;
};

export function useGuestSession(shareId: string) {
  const [hostPosition, setHostPosition] = useState<LatLngExpression | null>(null);
  const [guestPosition, setGuestPosition] = useState<LatLngExpression | null>(null);
  const [displayStatus, setDisplayStatus] = useState<string>("loading");
  const [isSharing, setIsSharing] = useState(true);

  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guestIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === "active") {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setDisplayStatus("active");
    } else if (newStatus === "stopped") {
      if (!stopTimerRef.current && displayStatus !== "stopped") {
        stopTimerRef.current = setTimeout(() => {
          setDisplayStatus("stopped");
        }, 3000);
      }
    }
  }, [displayStatus]);

  const updateGuestLocation = useCallback(async () => {
    if (!isSharing) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGuestPosition([latitude, longitude]);
        await supabase
          .from("sessions")
          .update({ guest_lat: latitude, guest_lng: longitude })
          .eq("id", shareId);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, [shareId, isSharing]);

  const handleGuestStop = async () => {
    setIsSharing(false);
    setGuestPosition(null);
    await fetch("/api/guest-leave", {
      method: "POST",
      body: JSON.stringify({ shareId }),
    });
  };

  const handleGuestStart = () => {
    setIsSharing(true);
  };

  useEffect(() => {
    if (!shareId) return;

    const fetchInitialSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", shareId)
        .single();

      if (error || !data) {
        setDisplayStatus("stopped");
      } else {
        setDisplayStatus(data.status);
        if (data.lat && data.lng) setHostPosition([data.lat, data.lng]);
      }
    };

    fetchInitialSession();
    updateGuestLocation();
    guestIntervalRef.current = setInterval(updateGuestLocation, 10000);

    const channel = supabase
      .channel(`session-channel-${shareId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${shareId}` },
        (payload) => {
          const newData = payload.new as SessionPayload;
          handleStatusChange(newData.status);
          if (newData.lat && newData.lng) {
            setHostPosition([newData.lat, newData.lng]);
          }
        }
      )
      .subscribe();

    return () => {
      if (guestIntervalRef.current) clearInterval(guestIntervalRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [shareId, handleStatusChange, updateGuestLocation]);

  useEffect(() => {
    const handleTabClose = () => {
      if (shareId) {
        const blob = new Blob([JSON.stringify({ shareId })], { type: "application/json" });
        navigator.sendBeacon("/api/guest-leave", blob);
      }
    };
    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [shareId]);

  return { hostPosition, guestPosition, displayStatus, isSharing, handleGuestStart, handleGuestStop };
}
