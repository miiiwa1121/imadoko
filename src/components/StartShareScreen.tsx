type Props = {
  handleShareStart: () => void;
};

export default function StartShareScreen({ handleShareStart }: Props) {
  return (
    <div 
      className="h-screen w-full bg-gray-100 flex flex-col items-center py-20 px-4 cursor-pointer"
      onClick={handleShareStart}
    >
      <div className="text-center mt-10">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Imadoko Share</h1>
        <p className="text-gray-700 text-base">
          現在地をリアルタイムで共有できます。
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center animate-bounce">
        <p className="font-bold text-2xl text-blue-600">画面をタップして共有を開始</p>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        共有リンクは開始後に発行されます
      </div>
    </div>
  );
}
