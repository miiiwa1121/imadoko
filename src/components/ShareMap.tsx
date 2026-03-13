"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import CustomMarker from "@/components/CustomMarker";
import { useEffect } from "react";

export type Participant = {
  id: string;
  name: string;
  color: string;
  lat: number | null;
  lng: number | null;
};

export type ShareMapProps = {
  participants: Participant[];
  myId: string;
  focusLocation?: LatLngExpression | null;
  focusKey?: number;
  onEditName?: () => void;
};

function MapUpdater({ focusLocation, focusKey }: { focusLocation?: LatLngExpression | null, focusKey?: number }) {
  const map = useMap();
  useEffect(() => {
    if (focusLocation) {
      map.flyTo(focusLocation, 16, { duration: 1.5 });
    }
  }, [focusLocation, focusKey, map]);
  return null;
}

export default function ShareMap({ 
  participants,
  myId,
  focusLocation,
  focusKey,
  onEditName
}: ShareMapProps) {
  // ① ホストの座標を最優先で探す
  const hostParticipant = participants.find(p => p.name === "ホスト" && p.lat !== null && p.lng !== null);
  // ② ホストがなければ他の参加者の有効な座標を探す
  const validParticipant = hostParticipant || participants.find(p => p.lat !== null && p.lng !== null);
  
  const centerPosition: LatLngExpression = 
    validParticipant ? [validParticipant.lat!, validParticipant.lng!] : [35.681236, 139.767125];

  return (
    <MapContainer
      center={centerPosition}
      zoom={15}
      minZoom={3}
      worldCopyJump={true}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
      className="z-0"
    >
      <MapUpdater focusLocation={focusLocation} focusKey={focusKey} />
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors"
        url="https://tile.openstreetmap.jp/{z}/{x}/{y}.png"
      />

      {participants.map((p) => {
        if (p.lat === null || p.lng === null) return null;
        const isSelf = p.id === myId;
        const isHost = p.name === "ホスト";
        const label = isHost ? "ホスト" : (isSelf ? "わたし" : p.name);
        
        return (
          <CustomMarker 
            key={p.id}
            position={[p.lat, p.lng]} 
            color={p.color}
            popupText={label}
            isSelf={isSelf}
            onEditName={(isSelf && !isHost) ? onEditName : undefined}
          />
        );
      })}
    </MapContainer>
  );
}