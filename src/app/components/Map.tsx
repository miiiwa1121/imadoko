"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { nanoid } from "nanoid";
import Spinner from "@/components/Spinner";
import { Share2, Link as LinkIcon } from 'lucide-react';
import { customIcon } from "@/lib/customIcons"; // カスタムアイコンをインポート

export default function Map() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 位置情報をDBに更新する関数
  const updateLocation = async (currentShareId: string) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition: LatLngExpression = [latitude, longitude];
        setPosition(newPosition);

        // sessionsテーブルの該当IDの行を更新する
        const { error } = await supabase
          .from("sessions")
          .update({ lat: latitude, lng: longitude })
          .eq("id", currentShareId);

        if (error) console.error("DB更新エラー:", error);
        else console.log("DBの位置情報を更新しました");
      },
      (err) => {
        console.error(err);
        setPosition([35.681236, 139.767125]);
      }
    );
  };

  // 2. 共有開始時にsessionsテーブルに行を追加する
  const handleShareStart = async () => {
    const newShareId = nanoid(10);
    localStorage.setItem("shareId", newShareId);
    setShareId(newShareId);

    // 新しいセッションをDBに作成
    const { error } = await supabase
      .from("sessions")
      .insert({ id: newShareId, status: "active" });

    if (error) {
      console.error("セッション作成エラー:", error);
      // エラーハンドリング（必要に応じて）
    } else {
      updateLocation(newShareId);
    }
  };

  // 3. 共有停止時にstatusを'stopped'に更新する
  const handleShareStop = async () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    if (shareId) {
      // DBのセッションステータスを更新
      const { error } = await supabase
        .from("sessions")
        .update({ status: "stopped" })
        .eq("id", shareId);
      if (error) console.error("セッション停止エラー:", error);
    }

    localStorage.removeItem("shareId");
    setShareId(null);
    setPosition(null);
  };

  // 4. localStorageからの復元ロジック
  useEffect(() => {
    const storedShareId = localStorage.getItem("shareId");
    if (storedShareId) {
      setShareId(storedShareId);
      updateLocation(storedShareId);
    }
    setIsLoading(false);
  }, []);

  // 5. 定期更新ロジック
  useEffect(() => {
    if (shareId) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(() => {
        updateLocation(shareId);
      }, 15000);
      return () => {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      };
    }
  }, [shareId]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // UI部分はほぼ変更なし
  if (isLoading) return <Spinner />;
  if (!shareId) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500 rounded-full">
              <Share2 size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Imadoko Share
          </h1>
          <p className="mb-8 text-gray-600">
            あなたの現在地を、一時的に共有するためのリンクをワンタップで作成します。
            アプリのインストールやアカウント登録は不要です。
          </p>
          <button
            onClick={handleShareStart}
            className="flex items-center justify-center w-full max-w-xs mx-auto px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105"
          >
            <LinkIcon size={20} className="mr-2" />
            共有リンクを作成
          </button>
        </div>
      </main>
    );
  }
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-800 text-white shadow-lg z-10">
        <p className="font-semibold text-lg">共有リンクが作成されました！</p>
        <p className="text-sm text-gray-300">このリンクを共有相手に送ってください。</p>
        <div className="flex items-center mt-2 space-x-2">
          <input type="text" readOnly value={`${window.location.origin}/share/${shareId}`} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-200" />
          <button onClick={handleCopyLink} className={`px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-colors ${ isCopied ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600" }`}>
            {isCopied ? "コピー完了！" : "コピー"}
          </button>
        </div>
        <button onClick={handleShareStop} className="w-full mt-3 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors">
          共有を停止する
        </button>
      </div>
      {position ? (
        <MapContainer center={position} zoom={16} scrollWheelZoom={true} style={{ flex: 1, width: "100%" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={customIcon}>
            <Popup>共有中の現在地</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="flex-1"><Spinner /></div>
      )}
    </div>
  );
}