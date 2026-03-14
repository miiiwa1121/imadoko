import { useState } from "react";
import { Share2, LinkIcon } from "lucide-react";

type Props = {
  handleShareStart: () => void;
  isStarting?: boolean;
};

export default function StartShareScreen({ handleShareStart, isStarting = false }: Props) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div
      className="h-screen w-full bg-white/70 backdrop-blur-sm relative pointer-events-auto"
      onClick={() => {
        if (!isStarting) {
          handleShareStart();
        }
      }}
    >
      <div className="flex flex-col items-center px-6 pt-16 text-center gap-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">Imadoko Share</h1>
        <p className="text-gray-700 text-sm sm:text-base">
          現在地をリアルタイムで共有できます。
        </p>
        <div className="mt-6 flex items-center justify-center w-full gap-4 animate-bounce">
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
          <p className="font-bold text-base sm:text-lg text-gray-800">画面をタップして共有を開始</p>
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
        </div>
        <button
          onClick={() => setIsDetailsOpen((prev) => !prev)}
          className="text-xs font-bold text-gray-500 hover:text-gray-700 transition"
        >
          {isDetailsOpen ? "詳細を閉じる" : "詳細を見る"}
        </button>
        {isDetailsOpen && (
          <div className="text-xs sm:text-sm text-gray-600 bg-white/80 border border-gray-100 rounded-2xl px-4 py-3 shadow-sm max-w-md">
            <p className="mb-2">共有リンクは開始後に発行されます。</p>
            <p>タブを開いたままにしておくと、位置情報がリアルタイムで更新されます。</p>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-16 flex flex-col items-center px-4">
        <div className="bg-blue-600 text-white p-5 rounded-full shadow-lg mb-4">
          <Share2 className="w-10 h-10" />
        </div>
        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
          <LinkIcon className="w-4 h-4" />
          共有リンクは開始後に発行されます
        </div>
      </div>
    </div>
  );
}
