import { Share2, LinkIcon } from "lucide-react";

type Props = {
  handleShareStart: () => void;
  isStarting?: boolean;
};

export default function StartShareScreen({ handleShareStart, isStarting = false }: Props) {
  return (
    <div
      className="min-h-screen w-full bg-white/70 backdrop-blur-sm relative pointer-events-auto"
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
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center w-full gap-4 animate-bounce">
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
          <p className="font-bold text-base sm:text-lg text-gray-800">画面をタップして共有を開始</p>
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
        </div>
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

      <div className="relative z-[900] mt-24 pb-20 px-6 sm:px-10 pointer-events-auto">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">使い方</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              まずは画面をタップして共有を開始します。リンクが発行されたら、相手に送信するだけで位置情報がリアルタイムに共有されます。
              ブラウザを閉じると共有は自動的に停止します。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">開発者について</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              個人開発として運営しているプロジェクトです。ユーザーの体験を最優先に、軽量で安心して使えるサービスを目指しています。
              ご意見・ご要望は今後の改善に活かします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
