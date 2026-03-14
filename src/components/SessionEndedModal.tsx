"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";

export function SessionEndedModal() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="text-blue-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">共有が終了しました</h2>
        <p className="text-sm text-gray-600 mb-6">
          ホストが位置情報の共有を停止したため、セッションが終了しました。
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  );
}
