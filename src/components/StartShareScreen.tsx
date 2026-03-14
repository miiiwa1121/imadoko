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
  <section className="relative min-h-screen flex flex-col items-center justify-start px-8 sm:px-12 pt-20 sm:pt-24 pb-12 text-center gap-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">Imadoko Share</h1>
        <p className="text-gray-700 text-sm sm:text-base">
          現在地をリアルタイムで共有できます。
        </p>
        <div className="flex items-center justify-center w-full gap-4 animate-bounce">
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
          <p className="font-bold text-base sm:text-lg text-gray-800">画面をタップして共有を開始</p>
          <div className="h-[1.5px] w-8 bg-gray-400"></div>
        </div>
        <div className="mt-8 flex flex-col items-center px-4">
          <div className="bg-blue-600 text-white p-5 rounded-full shadow-lg mb-4">
            <Share2 className="w-10 h-10" />
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <LinkIcon className="w-4 h-4" />
            共有リンクは開始後に発行されます
          </div>
          <div className="mt-4 flex flex-col items-center text-gray-400 animate-bounce">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-gray-400"></div>
          </div>
        </div>
      </section>

      <section className="relative z-[900] px-6 sm:px-10 pb-20">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-10 space-y-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">使い方</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              まずは画面をタップして共有を開始します。リンクが発行されたら、相手に送信するだけで位置情報がリアルタイムに共有されます。
              ブラウザを閉じると共有は自動的に停止します。
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "1. 共有開始", body: "タップでセッションを作成します。" },
              { title: "2. リンク送信", body: "発行されたリンクを相手に送ります。" },
              { title: "3. 位置共有", body: "地図でお互いの位置が見えます。" }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">開発者について</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              個人開発として運営しているプロジェクトです。ユーザーの体験を最優先に、軽量で安心して使えるサービスを目指しています。
              ご意見・ご要望は今後の改善に活かします。
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-xs text-blue-900 leading-relaxed">
              ✅ 安心ポイント: 共有はタブを閉じると停止し、位置情報は保存されません。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
