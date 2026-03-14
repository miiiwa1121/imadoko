import { Layers } from "lucide-react";
import { MAP_STYLES, getThumbnail } from "@/constants/mapStyles";
import { useState } from "react";

type Props = {
  mapStyleIndex: number;
  setMapStyleIndex: (index: number) => void;
  className?: string; // allow overriding position
};

export function MapStyleSelector({ mapStyleIndex, setMapStyleIndex, className = "absolute top-4 left-4 z-[1000]" }: Props) {
  const [isMapStyleOpen, setIsMapStyleOpen] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setIsMapStyleOpen(!isMapStyleOpen)}
        className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-md border border-gray-100 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors"
        title="地図のデザインを変更"
      >
        <Layers size={20} />
      </button>

      {isMapStyleOpen && (
        <div className="absolute top-12 left-0 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-100 w-64">
          <p className="text-xs font-bold text-gray-500 mb-2 px-1">地図デザイン</p>
          <div className="grid grid-cols-2 gap-2">
            {MAP_STYLES.map((style, i) => (
              <button
                key={i}
                onClick={() => {
                  setMapStyleIndex(i);
                  setIsMapStyleOpen(false);
                }}
                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all ${
                  mapStyleIndex === i 
                    ? "border-blue-500 bg-blue-50/50" 
                    : "border-transparent hover:bg-gray-100"
                }`}
              >
                <div 
                  className="w-full h-16 bg-gray-200 rounded-md mb-1.5 bg-cover bg-center shadow-sm border border-gray-200"
                  style={{ backgroundImage: `url(${getThumbnail(style.url)})` }}
                />
                <span className="text-[10px] font-bold text-gray-700 w-full text-center truncate">
                  {style.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
