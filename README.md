# 睡眠ログ / Sleep Log iOS

Apple Health の睡眠データを、日付別にブラウザで手軽に確認できるビューアアプリ。

🔗 **https://sleep-log-ios.vercel.app**

---

## 概要 / Overview

睡眠障害の治療記録をつけるにあたり、Apple ヘルスケアアプリの閲覧画面では日別・セッション別に詳細を把握しにくいという不便さを解消するために作成しました。

XML ファイルをブラウザで開くだけで、入眠時刻・起床時刻・在床時間・睡眠時間・覚醒率を日別に確認できます。データは一切サーバーに送信されません。

---

## 作者 / Author

X: [@roadstagineer](https://x.com/roadstagineer)

---

## ライセンス / License

Copyright (c) 2026 Ayaka Kobayashi. All rights reserved.

本リポジトリのソースコードは閲覧目的でのみ公開しています。
公開中のWebアプリは個人かつ非商用の範囲で利用できます。
詳細は [LICENSE](./LICENSE.md) をご覧ください。

機能の改善要望や不具合報告は X ([@roadstagineer](https://x.com/roadstagineer)) までお気軽にどうぞ。

---

This source code is publicly available for viewing only.
The web application may be used for personal, non-commercial purposes.
See [LICENSE](./LICENSE.md) for details.

---

## 使い方 / How to Use

### 1. Apple Health からデータをエクスポートする

1. iPhone の **ヘルスケア** アプリを開く
2. 右上のアイコン（プロフィール）をタップ
3. 「**すべてのヘルスケアデータを書き出す**」をタップ
4. 共有先を選んで zip ファイルを保存・展開する
5. 展開後の `apple_health_export/` フォルダ内にある **`export.xml`** を使用する

> **ファイルサイズが大きい場合:**  
> データ量が多いと読み込みに失敗することがあります。必要な期間のデータに絞って整形してからアップロードしてください。

### 2. アプリに読み込む

1. [sleep-log-ios.vercel.app](https://sleep-log-ios.vercel.app) をブラウザで開く
2. 「**export.xml を選択**」エリアをタップしてファイルを選ぶ
3. 解析が完了すると、最新の日付の睡眠ログが表示される

### 3. 日付を移動する

| 操作 | 動作 |
|------|------|
| `‹` / `›` ボタン | 前日・翌日に移動 |
| 画面を左右にスワイプ | 前日・翌日に移動 |
| 日付指定フォーム | 任意の日付に直接ジャンプ |

指定した日付のデータがない場合は、最初・最後の日付へのショートカットボタンが表示されます。

---

## 対応環境 / Requirements

- **対応デバイス:** iPhone（iOS）
- **対応ブラウザ:** Safari 推奨（iOS）

**Apple Watch 推奨:**  
Apple Watch を装着して睡眠すると、睡眠ステージ（コア・深い・レム・覚醒）が自動記録され、在床時間・睡眠時間・覚醒率を確認できます。  
Apple Watch がない場合でも、ヘルスケアアプリに睡眠データが手動入力されていれば睡眠時間の確認は可能です。

---

## 表示仕様 / Display Spec

各セッションに在床時間・睡眠時間・覚醒率を表示します。

覚醒率が20%以上のセッションはオレンジ色で強調表示されます。

この閾値は実際のデータを分析した結果、大半のセッションが0〜15%に集中していたことから設定しています。個人のデータに基づく設定のため、人によって体感が異なる場合があります。

---

## プライバシー / Privacy

- アップロードしたファイルは**サーバーに一切送信されません**
- すべての解析処理は**ブラウザ内で完結**します
- データが本サービスに保存・利用されることはありません
- インターネット接続はアプリの読み込み時のみ使用されます

---

## 開発者向け / For Developers

### 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | JavaScript (React) |
| スタイリング | インラインスタイル |
| デプロイ | Vercel |
| コンテナ | Docker / Docker Compose |

### ローカル起動

**Docker を使う場合（推奨）:**

```bash
# 開発サーバー（ホットリロードあり）
docker compose up dev
# → http://localhost:3000

# 本番ビルドの確認
docker compose up prod --build
# → http://localhost:3001
```

**Node.js を直接使う場合:**

```bash
npm install
npm run dev
# → http://localhost:3000
```

### デプロイ

Vercel と GitHub の `main` ブランチを連携済み。プッシュするだけで自動デプロイされます。

```bash
git push origin main
```

本番デプロイ前に `docker compose up prod --build` でビルドが通ることを確認してください。

### ファイル構成

```
.
├── app/
│   ├── layout.js      # ルートレイアウト・メタデータ・PWA設定
│   └── page.js        # メインページ（XML解析・睡眠セッション表示・日付ナビ）
├── public/
├── Dockerfile         # マルチステージビルド（deps / builder / runner）
├── compose.yaml       # 開発・本番用 Docker Compose 設定
├── next.config.js     # セキュリティヘッダー設定
└── package.json
```
