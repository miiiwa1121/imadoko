"use client";

import { Marker, Popup } from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";
import { User, MapPin } from 'lucide-react'; // 使いたいアイコンをインポート
import { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type CustomMarkerProps = {
  position: LatLngExpression;
  type: "host" | "guest";
  popupText: string;
};

export default function CustomMarker({ position, type, popupText }: CustomMarkerProps) {
  // タイプに応じた色とアイコンの設定
  const colorClass = type === "host" ? "bg-red-500" : "bg-blue-500";
  // ホストはMapPin、ゲストはUserアイコンにする例
  const IconComponent = type === "host" ? MapPin : User;

  // LucideアイコンをHTML文字列に変換
  const iconMarkup = renderToStaticMarkup(
    <IconComponent color="white" size={20} strokeWidth={2.5} />
  );

  // HTMLとCSSでカスタムアイコンを作成
  const customIcon = divIcon({
    className: "", // デフォルトのスタイルをリセット
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg ${colorClass}">
        ${iconMarkup}
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
        <div class="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-${type === "host" ? "red" : "blue"}-500"></div>
      </div>
    `,
    iconSize: [40, 40],   // アイコン全体のサイズ
    iconAnchor: [20, 46], // アイコンの「先端」の位置（中央下）
    popupAnchor: [0, -46], // ポップアップが出る位置（真上）
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup className="font-sans font-medium">{popupText}</Popup>
    </Marker>
  );
}