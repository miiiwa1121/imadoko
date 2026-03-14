import { LatLngExpression } from "leaflet";
import type { Participant } from "./ShareMap";

type Props = {
  me: Participant | undefined;
  host?: Participant | undefined;
  others: Participant[];
  handleFocus: (loc: LatLngExpression | null) => void;
  className?: string; // e.g. "absolute top-16 right-4 z-[1000] flex flex-col gap-2 max-h-[calc(100vh-140px)]"
  showMeFilter?: boolean; // In guest page it might be `me && isSharing` before showing
};

export function ParticipantList({ me, host, others, handleFocus, className, showMeFilter = true }: Props) {
  return (
    <div className={className}>
      {/* 常に最上部に固定したいもの（ホスト、および自分） */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* ホスト */}
        {host && (
          <button
            onClick={() => host.lat !== null && host.lng !== null && handleFocus([host.lat, host.lng])}
            disabled={!host.lat}
            className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px]"
            title="ホストの位置"
          >
            <div 
              style={{ backgroundColor: host.color }} 
              className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
            ></div>
            <p className="text-[10px] font-bold text-center truncate px-1">ホスト</p>
          </button>
        )}

        {/* 自分 */}
        {me && showMeFilter && (
          <button
            onClick={() => me.lat !== null && me.lng !== null && handleFocus([me.lat, me.lng])}
            disabled={!me.lat}
            className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px]"
            title="自分の位置"
          >
            <div 
              style={{ backgroundColor: me.color }} 
              className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
            ></div>
            <p className="text-[10px] font-bold text-center truncate px-1">
              {me.name === "ホスト" ? "ホスト" : /^P\d+$/.test(me.name) ? "わたし" : me.name}
            </p>
          </button>
        )}
      </div>
      
      {/* 他の参加者（画面が許す限り表示、超えたらスクロール） */}
      <div className="flex flex-col gap-2 overflow-y-auto hidden-scrollbar pr-1 pb-4">
        {others.map(p => (
          <button
            key={p.id}
            onClick={() => p.lat !== null && p.lng !== null && handleFocus([p.lat, p.lng])}
            disabled={!p.lat}
            className="bg-white/90 backdrop-blur shadow-md text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 w-[60px] shrink-0"
            title={`${p.name}の位置`}
          >
            <div 
              style={{ backgroundColor: p.color }} 
              className="w-4 h-4 rounded-full mx-auto mb-1 border-2 border-white shadow-sm"
            ></div>
            <span className="text-[10px] font-bold text-center truncate px-1 block w-full">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
