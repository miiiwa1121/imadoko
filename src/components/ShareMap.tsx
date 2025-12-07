"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { customIcon, guestIcon } from "@/lib/customIcons";

export type ShareMapProps = {
  hostPosition: LatLngExpression;
  guestPosition?: LatLngExpression | null;
};

export default function ShareMap({ hostPosition, guestPosition }: ShareMapProps) {
  // ゲスト位置がない場合はホスト位置を中心にする
  const centerPosition = guestPosition || hostPosition;

  return (
    <MapContainer
      center={centerPosition}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* ホストのマーカー（赤色） */}
      <Marker position={hostPosition} icon={customIcon}>
        <Popup>ホストの現在地</Popup>
      </Marker>
      
      {/* ゲストのマーカー（青色） */}
      {guestPosition && (
        <Marker position={guestPosition} icon={guestIcon}>
          <Popup>あなたの現在地</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}