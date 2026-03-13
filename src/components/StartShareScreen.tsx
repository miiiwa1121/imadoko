import { Share2, LinkIcon } from "lucide-react";

type Props = {
  handleShareStart: () => void;
};

export default function StartShareScreen({ handleShareStart }: Props) {
  return (
    <div 
      className="h-screen w-full bg-gray-100 flex items-center justify-center p-4 cursor-pointer"
      onClick={handleShareStart}
    >
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-sm w-full text-center hover:bg-gray-50 transition-colors">
        <h1 className="text-2xl font-bold mb-2">Imadoko Share</h1>
        <p className="text-gray-600 mb-6 text-sm">
          現在地をリアルタイムで共有できます。<br />
          画面をタップして共有を開始しましょう。
        </p>

        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white p-4 rounded-full animate-bounce">
            <Share2 className="w-8 h-8" />
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
          <LinkIcon className="w-3 h-3" />
          共有リンクは開始後に発行されます
        </div>
      </div>
    </div>
  );
}
