import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

export type Participant = {
  id: string;
  name: string;
  color: string;
  lat: number | null;
  lng: number | null;
};

const PALETTE = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Teal
  "#14B8A6", // Cyan
  "#F43F5E", // Rose
  "#84CC16"  // Lime
];

export function useMultiplayer(sessionId: string | null, isHost: boolean = false) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("loading");
  const [isSharing, setIsSharing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const joinSession = useCallback(async (currentSessionId: string) => {
    let storedId = sessionStorage.getItem(`participantId-${currentSessionId}`);
    
    // Check if we exist
    if (storedId) {
      const { data } = await supabase.from("session_participants").select("*").eq("id", storedId).single();
      if (!data) storedId = null; // Re-join if deleted somehow
    }

    if (!storedId) {
      // Need to create new participant
      storedId = nanoid();
      
      const { data: existing } = await supabase
        .from("session_participants")
        .select("participant_num")
        .eq("session_id", currentSessionId)
        .order("participant_num", { ascending: false })
        .limit(1);

      const nextNum = existing && existing.length > 0 ? existing[0].participant_num + 1 : 1;
      const initialName = `P${nextNum}`;
      const color = PALETTE[nextNum % PALETTE.length];

      await supabase.from("session_participants").insert({
        id: storedId,
        session_id: currentSessionId,
        participant_num: nextNum,
        name: initialName,
        color: color,
        lat: null,
        lng: null
      });

      sessionStorage.setItem(`participantId-${currentSessionId}`, storedId);
    }
    
    setMyId(storedId);
    setIsSharing(true);
    
    // Fetch initial participants
    fetchParticipants(currentSessionId);
  }, []);

  const fetchParticipants = async (currentSessionId: string) => {
    const { data } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", currentSessionId);
    
    if (data) {
      setParticipants(data);
    }
  };

  const updateLocation = useCallback(async () => {
    if (!isSharing || !myId) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Update local state optimistically
        setParticipants(prev => prev.map(p => 
          p.id === myId ? { ...p, lat: latitude, lng: longitude } : p
        ));

        // Update DB
        await supabase
          .from("session_participants")
          .update({ lat: latitude, lng: longitude })
          .eq("id", myId);
          
        if (isHost && sessionId) {
           await supabase.from("sessions").update({ lat: latitude, lng: longitude, status: 'active' }).eq("id", sessionId);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, [isSharing, myId, isHost, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    
    // If guest, fetch session status first
    if (!isHost) {
      supabase.from("sessions").select("status").eq("id", sessionId).single().then(({ data }) => {
        if (data && data.status !== "stopped") {
          setSessionStatus(data.status);
          joinSession(sessionId);
        } else {
          setSessionStatus("stopped");
        }
      });
    }

    // Channels for real-time
    const participantsChannel = supabase
      .channel(`participants-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "session_participants", filter: `session_id=eq.${sessionId}` }, () => {
        fetchParticipants(sessionId);
      })
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` }, (payload) => {
        if (payload.new.status === "stopped") {
          setSessionStatus("stopped");
          setIsSharing(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, isHost, joinSession]);

  // Start sending location
  useEffect(() => {
    if (isSharing && myId) {
      updateLocation(); // Immediate
      intervalRef.current = setInterval(updateLocation, 10000); 
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSharing, myId, updateLocation]);


  // Clean up on tab close
  useEffect(() => {
    const handleTabClose = () => {
      if (myId) {
        // Beacon to a new delete participant API Route or stop session route
        const blob = new Blob([JSON.stringify({ participantId: myId, sessionId })], { type: "application/json" });
        navigator.sendBeacon("/api/leave-multiplayer", blob);
      }
    };
    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [myId, sessionId]);

  const updateMyName = async (newName: string) => {
    if (!myId) return;
    await supabase.from("session_participants").update({ name: newName }).eq("id", myId);
  };
  
  const stopSharing = async () => {
    setIsSharing(false);
    if (myId) {
      await supabase.from("session_participants").delete().eq("id", myId);
      setMyId(null);
    }
  };

  const endSessionForEveryone = async () => {
    if (!sessionId) return;
    setIsSharing(false);
    await supabase.from("sessions").update({ status: "stopped" }).eq("id", sessionId);
    await supabase.from("session_participants").delete().eq("session_id", sessionId);
  };

  return { 
    participants, 
    myId, 
    sessionStatus, 
    isSharing, 
    setIsSharing,
    updateMyName,
    stopSharing,
    endSessionForEveryone,
    joinSession
  };
}
