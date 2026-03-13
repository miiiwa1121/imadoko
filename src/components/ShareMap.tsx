"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import CustomMarker from "@/components/CustomMarker";
import { useEffect } from "react";

export type ShareMapProps = {
  hostPosition: LatLngExpression | null;
  guestPosition: LatLngExpression | null;
  // ピンのラベル文字を自由に設定できるようにする
  hostLabel?: string;
  guestLabel?: string;
  focusLocation?: LatLngExpression | null;
  focusKey?: number;
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
  hostPosition, 
  guestPosition,
  hostLabel = "ホスト",   // デフォルト値
  guestLabel = "ゲスト",  // デフォルト値
  focusLocation,
  focusKey
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
      <MapUpdater focusLocation={focusLocation} focusKey={focusKey} />
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors"
        url="https://tile.openstreetmap.jp/{z}/{x}/{y}.png"
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