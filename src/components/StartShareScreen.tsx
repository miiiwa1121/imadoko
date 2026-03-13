import { Share2, LinkIcon } from "lucide-react";

type Props = {
  handleShareStart: () => void;
};

export default function StartShareScreen({ handleShareStart }: Props) {
  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Imadoko Share</h1>
        <p className="text-gray-600 mb-6 text-sm">
          現在地をリアルタイムで共有できます。<br />
          ボタンを押して共有を開始しましょう。
        </p>

        <button
          onClick={handleShareStart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl w-full flex items-center justify-center gap-2 transition"
        >
          <Share2 className="w-5 h-5" />
          共有を開始する
        </button>

        <div className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
          <LinkIcon className="w-3 h-3" />
          共有リンクは開始後に発行されます
        </div>
      </div>
    </div>
  );
}
