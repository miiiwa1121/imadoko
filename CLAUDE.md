# CLAUDE.md — imadoko

## プロジェクト概要

URLを共有するだけでリアルタイム位置共有できるWebアプリ。アカウント登録・アプリインストール不要。
本番URL: https://imadoko.link

## コマンド

```bash
npm run dev      # 開発サーバー起動（Turbopack）
npm run build    # プロダクションビルド（Turbopack）
npm run lint     # ESLintチェック
```

## アーキテクチャ

```
Browser (Host / Guest)
   ├─ Geolocation API（3秒ごとに位置取得）
   ├─ Next.js App Router UI
   └─ Supabase Realtime（PostgreSQL変更通知を購読）
                │
                ▼
         Supabase (Postgres)
         ├─ sessions              : id, status, lat, lng
         └─ session_participants  : id, session_id, participant_num, name, color, lat, lng
```

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    # トップ画面（ホスト）
│   ├── share/[shareId]/page.tsx    # ゲスト参加画面
│   ├── layout.tsx                  # メタデータ・Viewport設定
│   └── api/
│       ├── leave-multiplayer/      # タブ閉鎖時の退室（sendBeacon用）
│       └── stop-sharing/           # セッション停止
├── components/
│   ├── ShareMap.tsx                # Leaflet地図（SSR無効）
│   ├── CustomMarker.tsx            # アニメーション付きマーカー
│   ├── ActiveShareScreen.tsx       # ホスト用共有中UI
│   ├── StartShareScreen.tsx        # 共有開始前トップUI
│   └── ui/                         # Toast, LoadingOverlay
├── hooks/
│   └── useMultiplayer.ts           # リアルタイム同期・位置送信の中核
├── lib/
│   ├── supabaseClient.ts           # Supabaseクライアント（シングルトン）
│   └── participantBadge.ts         # バッジ文字列ロジック
└── constants/
    └── mapStyles.ts                # 地図スタイル定義（正典）
```

## 重要な実装ルール

### Leaflet / 地図
- `ShareMap` は必ず `dynamic(() => import(...), { ssr: false })` で読み込む。SSRで読むとクラッシュする
- 地図スタイルの定義は `src/constants/mapStyles.ts` を正典とする。コンポーネント内にコピーしない
- 地図スタイル切り替えUIは `MapStyleSelector` コンポーネントを使う。`mapStyleIndex` / `setMapStyleIndex` を渡す

### リアルタイム同期（useMultiplayer）
- 楽観的更新を徹底する。DB更新を待ってから `setParticipants` するのではなく、先にローカル状態を更新してからDB操作する
- 位置更新は移動量が約3m未満（緯度経度差 < 0.000027）の場合はDB通信をスキップする
- Supabase Realtimeのペイロードは `fetchParticipants`（全件再取得）を経由せず、届いたイベントで直接状態を更新する
- `recentlyRemovedRef` で楽観的削除後の遅延DELETEイベントを無視する

### セッション管理
- ホスト判定は `name === "ホスト"` で行う。IDではなく名前による判定
- プロフィール（id, num, name, color）は `sessionStorage` の `profile-{sessionId}` に保持する
- セッションIDは `sessionStorage` の `hostSessionId` に保持する（ページリロード時の復帰用）
- 自己修復: `updateLocation` でDB更新結果が0件なら upsert でデータを復活させる

### UI
- 地図は常にフルスクリーン（`h-screen`）。地図の上にUIを `absolute` で重ねる構成
- `z-index` の基準: 地図=0、UI操作要素=1000、警告バナー=1100、権限ガイド=1200
- `userScalable: false` はモバイルでのズーム禁止のため意図的に設定している（変更しない）

### API Routes
- タブ閉鎖時の退室は `navigator.sendBeacon` → `/api/leave-multiplayer` で処理する
- セッション停止は `useMultiplayer` 内の `endSessionForEveryone` で直接Supabaseを呼ぶ（APIルート経由でない）

## 環境変数

`.env.local` に以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`NEXT_PUBLIC_*` はブラウザ側で参照されるため、Supabase側のRLSポリシー設定が必須。

## 共通コンポーネントの使い方

参加者リストと地図スタイル切り替えは共通コンポーネント化されている。新しくページを追加する場合も必ずこれらを使うこと。

- **`ParticipantList`**: `host?`, `me?`, `others`, `handleFocus`, `showMeFilter?`, `className` を受け取る。ホストページでは `host` を省略（`me` がホスト本人のため）
- **`MapStyleSelector`**: `mapStyleIndex`, `setMapStyleIndex`, `className?` を受け取る。`isOpen` の状態は内部管理
- **`Participant` 型**: `src/hooks/useMultiplayer.ts` で定義・エクスポート。`ShareMap.tsx` は re-export するだけ。他ファイルは `useMultiplayer` からインポートする
