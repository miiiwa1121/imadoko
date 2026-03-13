"use client";

import { use, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ShareMapProps } from "@/components/ShareMap";
import Spinner from "@/components/Spinner";
import { Power, RefreshCw } from "lucide-react";
import { useGuestSession } from "@/hooks/useGuestSession";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export default function SharePage({ params }: PageProps) {
  const { shareId } = use(params);
  const { hostPosition, guestPosition, displayStatus, isSharing, handleGuestStart, handleGuestStop } =
    useGuestSession(shareId);

  const ShareMap = useMemo<React.ComponentType<ShareMapProps>>(
    () =>
      dynamic(() => import("@/components/ShareMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  if (displayStatus === "loading") return <Spinner />;

  if (displayStatus === "stopped") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">共有終了</h1>
          <p className="text-gray-600">ホストが位置情報の共有を停止しました。</p>
        </div>
      </div>
    );
  }

  if (!hostPosition) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
        <p className="ml-4 text-gray-600">ホストの位置情報を待機中...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen relative">
      <ShareMap 
        hostPosition={hostPosition} 
        guestPosition={isSharing ? guestPosition : null}
        hostLabel="ホスト"
        guestLabel="あなた" 
      />
      
      {/* ゲスト操作パネル */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-blue-100 pointer-events-auto flex items-center gap-4">
          {isSharing ? (
            <>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                あなたの位置を共有中
              </p>
              <button onClick={handleGuestStop} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1">
                <Power size={14} /> 停止
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                位置情報の共有を停止中
              </p>
              <button onClick={handleGuestStart} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1">
                <RefreshCw size={14} /> 再開
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}