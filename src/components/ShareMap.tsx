"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { customIcon } from "@/lib/customIcons";
import L from "leaflet";

export type ShareMapProps = {
  hostPosition: LatLngExpression;
  guestPosition?: LatLngExpression | null;
};

// ゲスト用のアイコン（青色）
const guestIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj4KICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEwIDEyLjUgMjggMTIuNSAyOHMyMC01IDEyLjUtMjhjMC02LjktNS42LTEyLjUtMTIuNS0xMi41eiIgZmlsbD0iIzMzNzJlNiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'fix-marker-size'
});

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