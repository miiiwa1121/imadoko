import { Share2, LinkIcon } from "lucide-react";

type Props = {
  handleShareStart: () => void;
};

export default function StartShareScreen({ handleShareStart }: Props) {
  return (
    <div 
      className="h-screen w-full bg-gray-100 cursor-pointer relative"
      onClick={handleShareStart}
    >
      <div className="text-center pt-24 px-4">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Imadoko Share</h1>
        <p className="text-gray-700 text-base">
          現在地をリアルタイムで共有できます。
        </p>
      </div>

      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center px-4">
        <div className="bg-blue-600 text-white p-5 rounded-full shadow-lg mb-4">
          <Share2 className="w-10 h-10" />
        </div>
        <p className="font-bold text-lg text-gray-800">画面をタップして共有を開始</p>
        <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
          <LinkIcon className="w-3 h-3" />
          共有リンクは開始後に発行されます
        </div>
      </div>
    </div>
  );
}
