"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState } from "react";
import { useLocationSession } from "@/hooks/useLocationSession";
import Spinner from "@/components/Spinner";
import { Share2, Link as LinkIcon } from 'lucide-react';
import { customIcon } from "@/lib/customIcons";
import L from "leaflet";

// ゲスト用のアイコン（青色）
const guestIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj4KICAKICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEwIDEyLjUgMjggMTIuNSAyOHMyMC01IDEyLjUtMjhjMC02LjktNS42LTEyLjUtMTIuNS0xMi41eiIgZmlsbD0iIzMzNzJlNiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'fix-marker-size'
});

export default function Map() {
  const { position, shareId, isLoading, handleShareStart, handleShareStop, guestPosition } = useLocationSession();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // UI部分はほぼ変更なし
  if (isLoading) return <Spinner />;
  if (!shareId) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500 rounded-full">
              <Share2 size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Imadoko Share
          </h1>
          <p className="mb-8 text-gray-600">
            あなたの現在地を、一時的に共有するためのリンクをワンタップで作成します。
            アプリのインストールやアカウント登録は不要です。
          </p>
          <button
            onClick={handleShareStart}
            className="flex items-center justify-center w-full max-w-xs mx-auto px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105"
          >
            <LinkIcon size={20} className="mr-2" />
            共有リンクを作成
          </button>
        </div>
      </main>
    );
  }
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-800 text-white shadow-lg z-10">
        <p className="font-semibold text-lg">共有リンクが作成されました！</p>
        <p className="text-sm text-gray-300">このリンクを共有相手に送ってください。</p>
        <div className="flex items-center mt-2 space-x-2">
          <input type="text" readOnly value={`${window.location.origin}/share/${shareId}`} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-200" />
          <button onClick={handleCopyLink} className={`px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-colors ${ isCopied ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600" }`}>
            {isCopied ? "コピー完了！" : "コピー"}
          </button>
        </div>
        <button onClick={handleShareStop} className="w-full mt-3 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors">
          共有を停止する
        </button>
      </div>
      {position ? (
        <MapContainer center={position} zoom={16} scrollWheelZoom={true} style={{ flex: 1, width: "100%" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={customIcon}>
            <Popup>あなたの現在地（ホスト）</Popup>
          </Marker>
          {guestPosition && (
            <Marker position={guestPosition} icon={guestIcon}>
              <Popup>共有相手の現在地（ゲスト）</Popup>
            </Marker>
          )}
        </MapContainer>
      ) : (
        <div className="flex-1"><Spinner /></div>
      )}
    </div>
  );
}