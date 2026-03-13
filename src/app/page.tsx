"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function Home() {
  // Mapコンポーネントをブラウザ側でのみ読み込む設定
  const Map = useMemo(
    () =>
      dynamic(() => import("@/app/components/Map"), {
        loading: () => <p>A map is loading</p>,
        ssr: false, // サーバーサイドでは描画しない
      }),
    []
  );

  return <Map />;
}
