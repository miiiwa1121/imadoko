"use client";

import { useState } from "react";
import { useLocationSession } from "@/hooks/useLocationSession";
import Spinner from "@/components/Spinner";
import { Share2, Link as LinkIcon } from 'lucide-react';
import dynamic from "next/dynamic";

// ShareMapを動的インポート（2つのピンを表示できるコンポーネントを再利用）
const ShareMap = dynamic(() => import("@/components/ShareMap"), {
  loading: () => <Spinner />,
  ssr: false,
});

export default function Map() {
  // useLocationSessionからguestPositionも受け取る
  const { position, guestPosition, shareId, isLoading, handleShareStart, handleShareStop } = useLocationSession();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  // 共有中の表示
  return (
    <div className="flex flex-col h-screen relative">
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

      {/* 地図コンポーネント：ホストとゲスト両方の位置を渡す */}
      <div className="flex-1 w-full h-full z-0">
        <ShareMap hostPosition={position} guestPosition={guestPosition} />
      </div>
    </div>
  );
}