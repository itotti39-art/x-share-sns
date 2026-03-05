# アーキテクチャ構成

## 現在の構成（MVPフェーズ）
- **フロントエンド:** React 18 + Vite + TypeScript
- **状態管理:** Zustand (LocalStorageを利用したモックデータ永続化)
- **スタイリング:** Tailwind CSS v4
- **API通信:** 全てフロントエンド内で完結するモック関数 (`src/lib/api.ts`)

## 本番連携へ向けた新たな構成案
ブラウザからSNS（X/Facebook/Threads）のAPIへ直接リクエストを送ることは、CORS制約とセキュリティリスク（APIキーの漏洩）のため不可能です。そのため、以下の構成へ移行します。

### 1. フロントエンド（現状のまま）
- クライアントアプリ（Vite React）。バックエンドと通信するためのAPIクライアント（axios/fetch）を追加します。

### 2. バックエンド（新規追加）
- APIキーを安全に保持し、SNSプラットフォームと通信するサーバー。
- **選択肢A: Node.js (Express) サーバーを追加**
  - 同一リポジトリ内に `server/` フォルダを追加。
  - フロントエンドからはローカルの `http://localhost:3000/api/posts` などへリクエストを送る。
- **選択肢B: Next.js API Routes への移行**
  - `Vite` から `Next.js` ＋ `Vercel` に完全移行し、サーバーレス関数でAPIを処理する。
- **選択肢C: Supabase (BaaS) の利用**
  - Supabase Edge Functionsを利用し、バックエンドインフラ管理を不要にする。

> [!NOTE]
> 開発スピードと現状のVite構成を活かすため、**選択肢A (Node.js/Expressの簡単な追加)** を推奨します。
