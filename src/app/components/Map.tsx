"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";
import Spinner from "@/components/Spinner";

export default function Map() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ページ読み込み状態を管理

  // --- ▼ここから変更・追加 ▼ ---

  // 1. ページが読み込まれた時に、localStorageから共有状態を復元する
  useEffect(() => {
    const storedShareId = localStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      // 復元時はすぐに位置情報を取得・送信する
      updateLocation(storedShareId, true);
    }
    setIsLoading(false); // 初期読み込み完了
  }, []); // 空の配列なので、初回の一度だけ実行される

  // 2. 位置情報を取得し、DBに保存する関数を更新
  const updateLocation = async (currentShareId: string, initialLoad = false) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition: LatLngExpression = [latitude, longitude];
        setPosition(newPosition);

        // Supabaseに送信
        const { error } = await supabase.from("locations").insert({
          lat: latitude,
          lng: longitude,
          share_id: currentShareId,
        });

        if (error) {
          console.error("Supabaseへのデータ保存に失敗しました:", error);
        } else {
          console.log(`Supabaseに現在地を保存しました (初回: ${initialLoad})`);
        }
      },
      (err) => {
        console.error(err);
        setPosition([35.681236, 139.767125]); // エラー時は東京駅
      }
    );
  };

  // 3. 「共有開始」時にlocalStorageに保存する
  const handleShareStart = () => {
    const newShareId = nanoid(10);
    localStorage.setItem("shareId", newShareId); // localStorageに保存
    setShareId(newShareId);
    updateLocation(newShareId, true);
  };

  // 4. 「共有停止」時にlocalStorageから削除する
  const handleShareStop = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    localStorage.removeItem("shareId"); // localStorageから削除
    setShareId(null);
    setPosition(null);
  };

  // 5. 定期更新のロジックは変更なし
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      intervalIdRef.current = setInterval(() => {
        updateLocation(shareId);
      }, 15000);

      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
      };
    }
  }, [shareId]);


  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- ▲ここまで変更・追加 ▲ ---


  // 初期読み込み中はスピナーを表示
  if (isLoading) {
    return <Spinner />;
  }

  // 共有が開始されていない場合
  if (!shareId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">リアルタイム位置情報共有アプリ</h1>
        <p className="mb-8 text-gray-600">ボタンを押して、あなたの現在地を一時的に共有するリンクを作成します。</p>
        <button
          onClick={handleShareStart}
          className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105"
        >
          共有リンクを作成
        </button>
      </div>
    );
  }

  // 共有が開始された場合
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-800 text-white shadow-lg z-10">
        <p className="font-semibold text-lg">共有リンクが作成されました！</p>
        <p className="text-sm text-gray-300">このリンクを共有相手に送ってください。</p>
        <div className="flex items-center mt-2 space-x-2">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/share/${shareId}`}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-200"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-colors ${
              isCopied ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isCopied ? "コピー完了！" : "コピー"}
          </button>
        </div>
        <button
          onClick={handleShareStop}
          className="w-full mt-3 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors"
        >
          共有を停止する
        </button>
      </div>
      {position ? (
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
        <div className="flex-1">
          <Spinner />
        </div>
      )}
    </div>
  );
}