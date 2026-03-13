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
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#14B8A6", "#F43F5E", "#84CC16"
];

export function useMultiplayer(sessionId: string | null, isHost: boolean = false) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("loading");
  const [isSharing, setIsSharing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJoiningRef = useRef(false);

  const joinSession = useCallback(async (currentSessionId: string) => {
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;

    try {
      const profileKey = `profile-${currentSessionId}`;
      const storedStr = sessionStorage.getItem(profileKey);
      let profile = storedStr ? JSON.parse(storedStr) : null;

      if (profile) {
        // ★自己修復機能①：リロードで削除指令が走っていても、問答無用で「上書き(Upsert)」してデータを復活させる
        await supabase.from("session_participants").upsert({
          id: profile.id,
          session_id: currentSessionId,
          participant_num: profile.num,
          name: profile.name,
          color: profile.color
        });
      } else {
        // 新規参加
        const { data: existing } = await supabase
          .from("session_participants")
          .select("participant_num, name")
          .eq("session_id", currentSessionId)
          .order("participant_num", { ascending: false });

        const existingHost = existing?.find(p => p.name === "ホスト");
        if (isHost && existingHost) return;

        const nextNum = existing && existing.length > 0 ? existing[0].participant_num + 1 : 1;
        const initialName = isHost ? "ホスト" : `P${nextNum}`;
        const color = PALETTE[(nextNum - 1) % PALETTE.length];

        profile = {
          id: nanoid(),
          num: nextNum,
          name: initialName,
          color: color
        };

        await supabase.from("session_participants").insert({
          id: profile.id,
          session_id: currentSessionId,
          participant_num: profile.num,
          name: profile.name,
          color: profile.color
        });

        // 自分のプロフィール一式をブラウザに記憶させておく
        sessionStorage.setItem(profileKey, JSON.stringify(profile));
      }
      
      setMyId(profile.id);
      setIsSharing(true);
      fetchParticipants(currentSessionId);
    } finally {
      isJoiningRef.current = false;
    }
  }, [isHost]);

  const fetchParticipants = async (currentSessionId: string) => {
    const { data } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", currentSessionId);
    if (data) setParticipants(data);
  };

  const updateLocation = useCallback(async () => {
    if (!isSharing || !myId || !sessionId) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        setParticipants(prev => prev.map(p => 
          p.id === myId ? { ...p, lat: latitude, lng: longitude } : p
        ));

        // ★自己修復機能②：更新時に「自分」がDBから消されていないかチェックする
        const { data } = await supabase
          .from("session_participants")
          .update({ lat: latitude, lng: longitude })
          .eq("id", myId)
          .select("id");
          
        // もしデータが無かったら（リロード等で消されてしまっていたら）、プロフィールを再挿入！
        if (data && data.length === 0) {
          const storedStr = sessionStorage.getItem(`profile-${sessionId}`);
          if (storedStr) {
            const profile = JSON.parse(storedStr);
            await supabase.from("session_participants").upsert({
              id: profile.id,
              session_id: sessionId,
              participant_num: profile.num,
              name: profile.name,
              color: profile.color,
              lat: latitude,
              lng: longitude
            });
          }
        }

        if (isHost) {
           await supabase.from("sessions").update({ lat: latitude, lng: longitude, status: 'active' }).eq("id", sessionId);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 5000 }
    );
  }, [isSharing, myId, isHost, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    
    if (!isHost) {
      supabase.from("sessions").select("status").eq("id", sessionId).single().then(({ data }) => {
        if (data && data.status !== "stopped") {
          setSessionStatus(data.status);
          joinSession(sessionId);
        } else {
          setSessionStatus("stopped");
        }
      });
    } else {
      joinSession(sessionId);
    }

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

  useEffect(() => {
    if (isSharing && myId) {
      updateLocation(); 
      intervalRef.current = setInterval(updateLocation, 10000); 
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSharing, myId, updateLocation]);

  useEffect(() => {
    const handleTabClose = () => {
      if (myId) {
        const blob = new Blob([JSON.stringify({ participantId: myId, sessionId })], { type: "application/json" });
        navigator.sendBeacon("/api/leave-multiplayer", blob);
      }
    };
    window.addEventListener("pagehide", handleTabClose);
    return () => window.removeEventListener("pagehide", handleTabClose);
  }, [myId, sessionId]);

  const updateMyName = async (newName: string) => {
    if (!myId || !sessionId) return;
    await supabase.from("session_participants").update({ name: newName }).eq("id", myId);
    
    // 名前の変更もブラウザに記憶させて、自己修復に備える
    const storedStr = sessionStorage.getItem(`profile-${sessionId}`);
    if (storedStr) {
      const profile = JSON.parse(storedStr);
      profile.name = newName;
      sessionStorage.setItem(`profile-${sessionId}`, JSON.stringify(profile));
    }
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