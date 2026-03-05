# SNS 各種API連携ノート

## 連携における必須要件

フロントエンド（React）だけではAPIキーが漏洩してしまうため、これらAPIを利用するには**バックエンド環境**が必須です。
また、ユーザーご自身のプラットフォーム開発者アカウントからの**APIキー**取得と、OAuth/トークンの設定が必要です。

### 1. X (旧Twitter) 連携
- **必要ポータル:** [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- **必要なもの:**
  - Client ID, Client Secret (OAuth 2.0 Auth Code with PKCE)
  - または Access Token / Secret (自身のBotアカウントとして投稿する場合)
- **API仕様:** Twitter API v2 (Free tierの場合、投稿数上限に注意)

### 2. Facebook 連携
- **必要ポータル:** [Meta for Developers](https://developers.facebook.com/)
- **必要なもの:**
  - App ID, App Secret
  - Facebookページのアクセストークン（ユーザーご自身のページに自動投稿する場合）
- **API仕様:** Graph API (`/me/feed` または `/{page_id}/feed`)

### 3. Threads 連携
- **必要ポータル:** [Meta for Developers](https://developers.facebook.com/)
- **必要なもの:**
  - Threads APIの有効化
  - Threadsアプリの認証情報（Facebookアカウントと紐付け）
- **API仕様:** Threads API (投稿用エンドポイントへのテキスト送信)

---

## 開発ステップ

1. ユーザーが上記3つのポータルで開発者登録を行い、各種Appを作成する。
2. 取得したシークレット情報を、追加する予定のバックエンド（Node.js）の `.env` ファイルに記述する。
3. Node.js側で `twitter-api-v2` などのSDKを用いて投稿処理を実装する。
