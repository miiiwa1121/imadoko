"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { customIcon, guestIcon } from "@/lib/customIcons";

export type ShareMapProps = {
  hostPosition: LatLngExpression | null;   // ホストの位置（赤）
  guestPosition: LatLngExpression | null;  // ゲストの位置（青）
};

export default function ShareMap({ hostPosition, guestPosition }: ShareMapProps) {
  // 地図の中心を決めるロジック
  // 1. ホストがいればホスト中心
  // 2. ホストがいなくてゲストがいればゲスト中心
  // 3. 両方いなければ東京駅
  const centerPosition: LatLngExpression = hostPosition || guestPosition || [35.681236, 139.767125];

  return (
    <MapContainer
      center={centerPosition}
      zoom={15} // 少し広域が見えるように調整
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ホストのマーカー（赤） */}
      {hostPosition && (
        <Marker position={hostPosition} icon={customIcon}>
          <Popup>ホスト（共有元）の現在地</Popup>
        </Marker>
      )}

      {/* ゲストのマーカー（青） */}
      {guestPosition && (
        <Marker position={guestPosition} icon={guestIcon}>
          <Popup>ゲスト（あなた/相手）の現在地</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}