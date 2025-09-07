"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type ShareMapProps = {
  position: LatLngExpression;
};

export default function ShareMap({ position }: ShareMapProps) {
  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>共有されている現在地</Popup>
      </Marker>
    </MapContainer>
  );
}