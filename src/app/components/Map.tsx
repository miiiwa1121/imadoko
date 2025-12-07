"use client";

import { useState } from "react";
import { useLocationSession } from "@/hooks/useLocationSession";
import Spinner from "@/components/Spinner";
import { Share2, Link as LinkIcon, MapPin } from 'lucide-react';
import dynamic from "next/dynamic";
import { customIcon } from "@/lib/customIcons";

// ShareMapを動的インポート（2つのピンを表示できるコンポーネントを再利用）
const ShareMap = dynamic(() => import("@/components/ShareMap"), {
  loading: () => <Spinner />,
  ssr: false,
});

export default function Map() {
  // useLocationSessionからguestPositionも受け取る
  const { position, guestPosition, shareId, isLoading, handleShareStart, handleShareStop } = useLocationSession();
  const [isCopied, setIsCopied] = useState(false);

  // ... (handleCopyLinkなどの既存ロジックはそのまま) ...
  const handleCopyLink = () => {
     // ... 既存のコード ...
     const link = `${window.location.origin}/share/${shareId}`;
     navigator.clipboard.writeText(link);
     setIsCopied(true);
     setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) return <Spinner />;

  if (!shareId) {
    // ... 共有開始前のUI (既存のまま) ...
    return (
       // ...既存のJSX...
       <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        {/* ...省略... */}
         <button onClick={handleShareStart} /*...*/ >
           共有リンクを作成
         </button>
       </div>
    );
  }

  // 共有中の表示
  return (
    <div className="flex flex-col h-screen relative">
      {/* 上部パネル */}
      <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
         {/* ...既存のリンクコピーUIなど... */}
         <div className="flex items-center space-x-2 mb-3">
             {/* ... */}
             <input type="text" readOnly value={`${window.location.origin}/share/${shareId}`} 
                className="w-full bg-gray-100 p-2 rounded text-sm outline-none" 
             />
             <button onClick={handleCopyLink} className="...">
               {isCopied ? "完了" : <LinkIcon size={18} />}
             </button>
         </div>
         
         <button onClick={handleShareStop} className="w-full bg-red-500 text-white py-2 rounded-lg font-bold shadow-md hover:bg-red-600 transition-colors">
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