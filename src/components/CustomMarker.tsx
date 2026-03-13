"use client";

import { Marker, Popup } from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";
import { User, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from "react-dom/server";

export type CustomMarkerProps = {
  position: LatLngExpression;
  color: string;
  popupText: string;
  isSelf: boolean;
  onEditName?: () => void;
};

export default function CustomMarker({ position, color, popupText, isSelf, onEditName }: CustomMarkerProps) {
  const IconComponent = isSelf ? MapPin : User;
  
  const iconMarkup = renderToStaticMarkup(
    <IconComponent color="white" size={20} strokeWidth={2.5} />
  );

  const customIcon = divIcon({
    className: "", 
    html: `
      <div style="background-color: ${color};" class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg">
        ${iconMarkup}
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
        <div style="border-top-color: ${color};" class="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px]"></div>
      </div>
    `,
    iconSize: [40, 40],   
    iconAnchor: [20, 46], 
    popupAnchor: [0, -46], 
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup className="font-sans font-medium min-w-[120px]">
        <div className="text-center flex flex-col gap-2 items-center">
          <span className="font-bold text-gray-800">{popupText}</span>
          {isSelf && onEditName && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEditName();
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
            >
              名前を変更
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}