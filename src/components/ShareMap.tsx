"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import CustomMarker from "@/components/CustomMarker";

export type ShareMapProps = {
  hostPosition: LatLngExpression | null;
  guestPosition: LatLngExpression | null;
  // ▼ 追加: ピンのラベル文字を自由に設定できるようにする
  hostLabel?: string;
  guestLabel?: string;
};

export default function ShareMap({ 
  hostPosition, 
  guestPosition,
  hostLabel = "ホスト",   // デフォルト値
  guestLabel = "ゲスト"   // デフォルト値
}: ShareMapProps) {
  const centerPosition: LatLngExpression = hostPosition || guestPosition || [35.681236, 139.767125];

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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ホストのマーカー（赤） */}
      {hostPosition && (
        <CustomMarker 
          position={hostPosition} 
          type="host" 
          popupText={hostLabel} // 受け取った文字を表示
        />
      )}

      {/* ゲストのマーカー（青） */}
      {guestPosition && (
        <CustomMarker 
          position={guestPosition} 
          type="guest" 
          popupText={guestLabel} // 受け取った文字を表示
        />
      )}
    </MapContainer>
  );
}