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
  const lastSentPosRef = useRef<{lat: number, lng: number} | null>(null);

  const joinSession = useCallback(async (currentSessionId: string) => {
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;

    try {
      const profileKey = `profile-${currentSessionId}`;
      const storedStr = sessionStorage.getItem(profileKey);
      let profile = storedStr ? JSON.parse(storedStr) : null;

      // 事前取得した座標があれば利用する
      const lastLatStr = sessionStorage.getItem("last_lat");
      const lastLngStr = sessionStorage.getItem("last_lng");
      const initialLat = lastLatStr ? parseFloat(lastLatStr) : null;
      const initialLng = lastLngStr ? parseFloat(lastLngStr) : null;

      if (profile) {
        if (!isHost && profile.name === "ホスト") {
          profile.name = `P${profile.num || Math.floor(Math.random() * 100)}`;
          sessionStorage.setItem(profileKey, JSON.stringify(profile));
        }
        
        // ★自己修復機能①：リロードで削除指令が走っていても、問答無用で「上書き(Upsert)」してデータを復活させる
        await supabase.from("session_participants").upsert({
          id: profile.id,
          session_id: currentSessionId,
          participant_num: profile.num,
          name: profile.name,
          color: profile.color,
          lat: initialLat,
          lng: initialLng
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
          color: profile.color,
          lat: initialLat,
          lng: initialLng
        });

        // 自分のプロフィール一式をブラウザに記憶させておく
        sessionStorage.setItem(profileKey, JSON.stringify(profile));
      }
      
      // ② 自分のピンの即時表示（楽観的更新）
      // DBへの保存を待って再取得するのではなく、ローカルの状態にまず追加して表示を早める
      const myParticipantData: Participant = {
        id: profile.id,
        name: profile.name,
        color: profile.color,
        lat: initialLat,
        lng: initialLng
      };
      
      setParticipants(prev => {
        if (!prev.some(p => p.id === myParticipantData.id)) {
          return [...prev, myParticipantData];
        }
        return prev;
      });

      setMyId(profile.id);
      setIsSharing(true);
      // 通信の効率化に伴い、ここでの全体再取得(fetchParticipants)は省略・または並行処理で任せる
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
        
        // ローカルのUI（自分のピン）は常に最新に滑らかに動かす
        setParticipants(prev => prev.map(p => 
          p.id === myId ? { ...p, lat: latitude, lng: longitude } : p
        ));

        if (lastSentPosRef.current) {
          const dLat = Math.abs(lastSentPosRef.current.lat - latitude);
          const dLng = Math.abs(lastSentPosRef.current.lng - longitude);
          // 約5m未満の移動（GPSのブレ）ならDB通信をスキップ
          if (dLat < 0.00005 && dLng < 0.00005) {
            return;
          }
        }

        // 5m以上動いた場合のみ通信を実行
        lastSentPosRef.current = { lat: latitude, lng: longitude };

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
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 2500 }
    );
  }, [isSharing, myId, isHost, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    
    // ① 初期読み込みの高速化：ホストのピンなどを参加処理と並行して先行読み込みする
    fetchParticipants(sessionId);
    
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
      .on("postgres_changes", { event: "*", schema: "public", table: "session_participants", filter: `session_id=eq.${sessionId}` }, (payload) => {
        // ③ 通信の効率化：DBの再取得(fetchParticipants)を待たずに、届いたpayloadで直接状態を更新する
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as Participant;
          setParticipants(prev => {
            const exists = prev.some(p => p.id === newParticipant.id);
            if (!exists) {
              return [...prev, newParticipant];
            }
            return prev;
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as Participant;
          setParticipants(prev => {
            return prev.map(p => p.id === updatedParticipant.id ? { ...p, ...updatedParticipant } : p);
          });
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
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
      intervalRef.current = setInterval(updateLocation, 3000); 
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
    
    // ④ 楽観的更新(Optimistic UI) - DB更新を待たずにUIを即座に反映させる
    setParticipants(prev => prev.map(p => 
      p.id === myId ? { ...p, name: newName } : p
    ));

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
      // 楽観的更新
      setParticipants(prev => prev.filter(p => p.id !== myId));
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