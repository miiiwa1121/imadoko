export function PermissionGuide() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4 max-w-md mx-auto shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-red-500 shrink-0 mt-0.5 text-xl">⚠️</div>
        <div>
          <h3 className="text-sm font-bold text-red-800 mb-1">位置情報の取得が許可されていません</h3>
          <p className="text-xs text-red-700 mb-3 leading-relaxed">
            リアルタイムで位置を共有するには、ブラウザ・端末の設定で位置情報へのアクセスを許可してください。
          </p>
          <div className="bg-white/60 p-3 rounded-lg text-xs text-gray-800">
            <p className="font-bold mb-1">📋 設定の確認方法</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>iPhone (Safari):</strong> 設定 &gt; プライバシーとセキュリティ &gt; 位置情報サービス</li>
              <li><strong>Android (Chrome):</strong> ブラウザの設定 &gt; サイトの設定 &gt; 位置情報</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-red-700 transition"
          >
            許可して画面を再読み込み
          </button>
        </div>
      </div>
    </div>
  );
}
