"use client";

import { MapContainer, TileLayer } from "react-leaflet"; // Marker, Popupのインポートは不要
import { LatLngExpression } from "leaflet";

// ▼ 新しいマーカーコンポーネントをインポート
import CustomMarker from "@/components/CustomMarker";

export type ShareMapProps = {
  hostPosition: LatLngExpression | null;
  guestPosition: LatLngExpression | null;
};

export default function ShareMap({ hostPosition, guestPosition }: ShareMapProps) {
  const centerPosition: LatLngExpression = hostPosition || guestPosition || [35.681236, 139.767125];

  return (
    <MapContainer
      center={centerPosition}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
      className="z-0" // 地図の重なり順を明示
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ホストのマーカー（赤） */}
      {hostPosition && (
        <CustomMarker 
          position={hostPosition} 
          type="host" 
          popupText="ホスト（共有元）" 
        />
      )}

      {/* ゲストのマーカー（青） */}
      {guestPosition && (
        <CustomMarker 
          position={guestPosition} 
          type="guest" 
          popupText="ゲスト（あなた/相手）" 
        />
      )}
    </MapContainer>
  );
}