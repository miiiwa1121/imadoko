# Imadoko Share (イマドコシェア)

# 日本語版

[![Demo](https://img.shields.io/badge/Demo-Launch_App-blue?style=for-the-badge&logo=vercel)](https://imadoko.vercel.app/)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[English Version is below](#imadoko-share-english-version)

**「今どこ？」を解決する、最もシンプルな位置情報共有アプリ。**

Imadoko Shareは、アプリのインストールやアカウント登録なしで、発行されたURLを送るだけでリアルタイムに位置情報を共有できるWebサービスです。

🔗 **デモアプリを試す**: [https://imadoko.vercel.app/](https://imadoko.vercel.app/)

## 🌟 特徴

* **完全ブラウザ完結**: 専用アプリのインストールは不要。URLをクリックするだけでブラウザ上で動作します。
* **アカウント登録不要**: 面倒なサインアップやログインはありません。誰でも0秒で使い始められます。
* **リアルタイム双方向共有**: ホスト（共有元）とゲスト（共有先）がお互いの位置をリアルタイムに地図上で確認できます。
* **プライバシー重視**: 位置情報は「使い捨て」のセッションIDで管理。タブを閉じると共有は自動的に停止され、データは残りません。
* **モダンなUI**: 直感的でわかりやすいデザインを採用しています。

## 🛠 技術スタック

* **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Database / Realtime**: [Supabase](https://supabase.com/)
* **Map Library**: [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Deployment**: [Vercel](https://vercel.com/)

## 🚀 ローカルでの実行方法

このプロジェクトをあなたのPCで動かすための手順です。

### 1. リポジトリのクローン
```bash
git clone [https://github.com/miiiwa1121/imadoko.git](https://github.com/miiiwa1121/imadoko.git)
cd imadoko

### 2\. 依存関係のインストール

```bash
npm install
```

### 3\. 環境変数の設定

ルートディレクトリに `.env.local` ファイルを作成し、Supabaseのキーを設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4\. Supabaseのセットアップ

SupabaseのSQLエディタで以下のクエリを実行し、必要なテーブルを作成します。

```sql
-- テーブルの作成
CREATE TABLE sessions (
    id text PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    lat float8,
    lng float8,
    guest_lat float8,
    guest_lng float8,
    status text DEFAULT 'active'
);

-- リアルタイム機能の有効化
alter publication supabase_realtime add table sessions;

-- セキュリティポリシー（開発用: 全アクセス許可）
alter table sessions enable row level security;
create policy "Enable access to all users" on "sessions" for all using (true) with check (true);
```

### 5\. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作を確認してください。

-----

\<a id="imadoko-share-english-version"\>\</a\>

# English Version

[![Demo](https://img.shields.io/badge/Demo-Launch_App-blue?style=for-the-badge&logo=vercel)](https://imadoko.vercel.app/)
**The simplest way to share your location in real-time.**

Imadoko Share is a web-based service that allows you to share your real-time location simply by sending a link. No app installation or account registration is required.

🔗 **Try the Demo**: [https://imadoko.vercel.app/](https://imadoko.vercel.app/)

## 🌟 Features

  * **Browser-Based**: No need to install any apps. Works directly in your browser.
  * **No Registration**: Skip the signup process. Start sharing instantly.
  * **Real-time Bidirectional Sharing**: Both the host and the guest can see each other's location on the map in real-time.
  * **Privacy First**: Location data is managed via disposable session IDs. Sharing stops automatically when the tab is closed.
  * **Modern UI**: Intuitive and clean design.

## 🛠 Tech Stack

  * **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
  * **Language**: [TypeScript](https://www.typescriptlang.org/)
  * **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
  * **Database / Realtime**: [Supabase](https://supabase.com/)
  * **Map Library**: [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/)
  * **Icons**: [Lucide React](https://lucide.dev/)
  * **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1\. Clone the repository

```bash
git clone [https://github.com/miiiwa1121/imadoko.git](https://github.com/miiiwa1121/imadoko.git)
cd imadoko
```

### 2\. Install dependencies

```bash
npm install
```

### 3\. Set up Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4\. Supabase Setup

Run the following SQL query in your Supabase SQL Editor to create the necessary table.

```sql
-- Create table
CREATE TABLE sessions (
    id text PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    lat float8,
    lng float8,
    guest_lat float8,
    guest_lng float8,
    status text DEFAULT 'active'
);

-- Enable Realtime
alter publication supabase_realtime add table sessions;

-- RLS Policy (For development: allow all access)
alter table sessions enable row level security;
create policy "Enable access to all users" on "sessions" for all using (true) with check (true);
```

### 5\. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` with your browser to see the result.

## 📄 License

This project is licensed under the MIT License.

```
```