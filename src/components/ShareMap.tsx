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
  // 参加者から有効な位置の最初のものを初期中心に
  const validParticipant = participants.find(p => p.lat !== null && p.lng !== null);
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
        const label = isSelf ? "わたし" : p.name;
        
        return (
          <CustomMarker 
            key={p.id}
            position={[p.lat, p.lng]} 
            color={p.color}
            popupText={label}
            isSelf={isSelf}
            onEditName={onEditName}
          />
        );
      })}
    </MapContainer>
  );
}