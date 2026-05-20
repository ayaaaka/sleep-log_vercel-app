# 睡眠ログ

Apple Health からエクスポートした XML を読み込んで、日別の睡眠セッションを表示するビューアアプリ。

## 使用技術

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | JavaScript (React) |
| スタイリング | インラインスタイル |
| デプロイ | Vercel |
| コンテナ | Docker / Docker Compose |

## アプリの概要

- Apple Health の `sleep_recent.xml` をブラウザ上でアップロードするだけで動作
- サーバーへのデータ送信なし（XMLの解析はすべてクライアント側で完結）
- スマホ向けに最適化されたUI（スワイプで日付移動、PWA対応メタタグ）

## 環境構築

### 前提

- Docker / Docker Compose がインストールされていること

### 開発サーバー起動

```bash
docker compose up dev
```

`http://localhost:3000` でアクセスできる。ファイルを編集するとホットリロードが効く。

### 本番ビルドの確認

```bash
docker compose up prod --build
```

`http://localhost:3001` でアクセスできる。Vercel へデプロイする前の動作確認に使う。

### Docker を使わない場合（Node.js 直接）

```bash
npm install
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm start       # 本番サーバー起動
```

## 動作確認方法

1. Apple Health アプリ → プロフィール → 「ヘルスデータをエクスポート」
2. エクスポートされた zip を展開し、`apple_health_export/` 内の XML を Claude に渡して `sleep_recent.xml` を書き出してもらう
3. アプリを開き、`sleep_recent.xml` をアップロード
4. 日付ナビ（`‹` / `›`）またはスワイプで日付を移動して睡眠ログを確認

## デプロイ

Vercel に接続済み。`main` ブランチへのプッシュで自動デプロイされる。

```bash
git push origin main
```

ローカルで本番ビルドが通ることを確認してからプッシュすること（`docker compose up prod --build`）。

## ディレクトリ構成

```
.
├── app/
│   ├── layout.js   # ルートレイアウト・メタデータ・PWA設定
│   └── page.js     # メインページ（XML解析・UI）
├── public/
├── Dockerfile
├── compose.yaml
├── next.config.js
└── package.json
```
