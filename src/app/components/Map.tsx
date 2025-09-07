"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useState, useEffect, useRef } from "react"; // useRefをインポート
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";

export default function Map() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  // useRefを使って、setIntervalのIDを保持する
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // 位置情報を取得し、DBに保存する関数
  const updateLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition: LatLngExpression = [latitude, longitude];
        setPosition(newPosition);

        const { error } = await supabase.from("locations").insert({
          lat: latitude,
          lng: longitude,
          share_id: currentShareId,
        });

        if (error) {
          console.error("Supabaseへのデータ保存に失敗しました:", error);
        } else {
          console.log("Supabaseに現在地を保存しました！");
        }
      },
      (err) => {
        console.error(err);
        setPosition([35.681236, 139.767125]);
      }
    );
  };

  // 「共有開始」ボタンが押された時の処理
  const handleShareStart = () => {
    const newShareId = nanoid(10);
    setShareId(newShareId);
    updateLocation(newShareId);
  };

  // --- ▼ここから追加・変更 ▼ ---
  // 「共有停止」ボタンが押された時の処理
  const handleShareStop = () => {
    // 定期更新を停止する
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    // 状態を初期化して、最初の画面に戻す
    setShareId(null);
    setPosition(null);
  };
  // --- ▲ここまで追加・変更 ▲ ---

  // 共有が開始されたら、定期的に位置情報を更新する
  useEffect(() => {
    if (shareId) {
      // 既存のintervalがあればクリアする
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      // setIntervalのIDをuseRefに保存
      intervalIdRef.current = setInterval(() => {
        updateLocation(shareId);
      }, 15000);

      // コンポーネントが消える時に定期更新を停止
      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
      };
    }
  }, [shareId]);

  // UI部分
  if (!shareId) {
    // ... 共有開始画面（変更なし） ...
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">リアルタイム位置情報共有</h1>
        <p className="mb-8">ボタンを押して、あなたの位置情報を共有しましょう。</p>
        <button
          onClick={handleShareStart}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          共有リンクを作成
        </button>
      </div>
    );
  }

  // 共有が開始された場合
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-800 text-white">
        <p className="font-semibold">共有リンクが作成されました！</p>
        <p className="text-sm">このリンクを共有相手に送ってください。</p>
        <input
          type="text"
          readOnly
          value={`${window.location.origin}/share/${shareId}`}
          className="w-full p-2 mt-2 bg-gray-700 rounded border border-gray-600"
          onClick={(e) => e.currentTarget.select()}
        />
        {/* --- ▼ここから追加 ▼ --- */}
        <button
          onClick={handleShareStop}
          className="w-full mt-3 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors"
        >
          共有を停止する
        </button>
        {/* --- ▲ここまで追加 ▲ --- */}
      </div>
      {position ? (
        // ... 地図表示部分（変更なし） ...
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={true}
          style={{ flex: 1, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>共有中の現在地</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p>現在地を取得中です…</p>
        </div>
      )}
    </div>
  );
}