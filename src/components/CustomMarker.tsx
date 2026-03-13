"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Marker, Popup } from "react-leaflet";
import { LatLngExpression, divIcon } from "leaflet";
import { User, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from "react-dom/server";

export type CustomMarkerProps = {
  position: LatLngExpression;
  color: string;
  popupText: string;
  isSelf: boolean;
  onEditName?: (newName: string) => void;
};

export default function CustomMarker({ position, color, popupText, isSelf, onEditName }: CustomMarkerProps) {
  const [inputValue, setInputValue] = useState(popupText);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(popupText);
    }
  }, [popupText, isEditing]);

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

  const handleFocus = () => {
    setIsEditing(true);
    if (inputValue === "わたし" || /^P\d+$/.test(inputValue)) {
      setInputValue("");
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onEditName && inputValue.trim() !== "") {
      onEditName(inputValue.trim());
    } else {
      setInputValue(popupText);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.currentTarget.blur();
    }
  };

  return (
    <Marker position={position} icon={customIcon}>
      <Popup className="font-sans font-medium min-w-[120px]" closeButton={false}>
        <div className="text-center flex flex-col gap-2 items-center">
          {onEditName ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={(popupText === "わたし" || /^P\d+$/.test(popupText)) ? "わたし" : "名前を入力"}
              className="w-full text-center font-bold text-gray-800 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
            />
          ) : (
            <span className="font-bold text-gray-800">{popupText}</span>
          )}
        </div>
      </Popup>
    </Marker>
  );
}