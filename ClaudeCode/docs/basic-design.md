# 基本設計書

**プロジェクト**: ADAMS Lite
**最終更新**: 2026-03-02

---

## 目次

1. [システム構成](#1-システム構成)
2. [コンテナ構成](#2-コンテナ構成)
3. [技術スタック](#3-技術スタック)
4. [ページ構成](#4-ページ構成)
5. [API設計](#5-api設計)
6. [行事計画モジュール設計](#6-行事計画モジュール設計)

---

## 1. システム構成

### アーキテクチャ方針

**モジュラーモノリス**を採用する。
各機能はコード上でモジュールとして明確に分離しつつ、バックエンドサーバーは1つに統合することで、個人・家庭での運用・保守を容易にする。

```
┌──────────────────────────────────────────────────────────┐
│                      Docker Compose                       │
│                                                          │
│  ┌──────────┐        ┌────────────────────────────────┐  │
│  │  nginx   │───────▶│  React + TypeScript (Vite)     │  │
│  │ (proxy)  │        │  ポート: 3000（内部）            │  │
│  └────┬─────┘        └────────────────────────────────┘  │
│       │                                                  │
│       │              ┌────────────────────────────────┐  │
│       └─────────────▶│  Express + TypeScript          │  │
│                      │  モジュラーモノリス構成          │  │
│                      │  ├─ budget（予算管理）           │  │
│                      │  ├─ closing（決算管理）          │  │
│                      │  ├─ events（行事計画）           │  │
│                      │  ├─ funds（基金）                │  │
│                      │  ├─ reports（報告書）            │  │
│                      │  └─ shared（共通）               │  │
│                      │  ポート: 4000（内部）             │  │
│                      └──────────┬─────────────────────┘  │
│                                 │                        │
│                      ┌──────────▼─────────────────────┐  │
│                      │        MySQL 8.0                │  │
│                      │     （Prisma ORM 経由）          │  │
│                      │  ポート: 3306（内部）             │  │
│                      └────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  discord-bot（Discord Bot コンテナ）                 │ │
│  │  Discord.js                                         │ │
│  │  ↓ HTTP POST /api/v1/actuals/discord（APIキー認証）  │ │
│  │  → backend:4000 へ内部通信                           │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
      ↑
  外部アクセス
  ポート: 80 / 443
```

> **Discord Bot の位置づけ**: Discord BotはDocker Compose内の独立コンテナ（`discord-bot`）として動作する。DBには直接アクセスせず、Docker Compose内部ネットワーク経由で `POST /api/v1/actuals/discord` を呼び出す。自宅NAS（UGREEN NAS）上でDocker Composeにより他サービスと一元管理する。

---

## 2. コンテナ構成

| コンテナ名 | イメージ | 役割 | 外部ポート |
|---|---|---|---|
| nginx | nginx:alpine | リバースプロキシ・HTTPS終端 | 80 / 443 |
| frontend | node:lts-alpine | React SPA（開発時）/ 静的配信（本番） | - |
| backend | node:lts-alpine | Express REST API | - |
| db | mysql:8.0 | データベース | - |
| discord-bot | node:lts-alpine | Discord Bot（現金精算即時連携）。API経由でbackendと通信 | - |

### ルーティング（nginx）

| パス | 転送先 |
|---|---|
| `/api/*` | backend:4000 |
| `/*` | frontend:3000（開発） / 静的ファイル（本番） |

---

## 3. 技術スタック

| 区分 | 技術 | バージョン | 備考 |
|---|---|---|---|
| フロントエンド | React | 19 | |
| | TypeScript | 5 | |
| | Vite | 7 | ビルドツール |
| | React Router | v7 | SPA ルーティング |
| バックエンド | Node.js | LTS | |
| | Express | 5 | REST API |
| | TypeScript | 5 | |
| ORM | Prisma | 6 | 型安全なDB操作 |
| データベース | MySQL | 8.0 | |
| 認証 | JWT | - | アクセス + リフレッシュトークン |
| PDF出力 | @react-pdf/renderer（MIT） | - | req-03で確定済み |
| Excel出力 | ExcelJS 等 | - | 実装フェーズで選定 |
| インフラ | Docker Compose | - | 自宅サーバー運用 |
| リバースプロキシ | nginx | alpine | HTTPS終端 |
| UIデザイン | デジタル庁DADS | - | デザインシステム準拠 |
| Discord Bot | Discord.js | 最新版 | 現金精算即時連携モジュール（独立プロセス） |

---

## 4. ページ構成

### 画面一覧

| ページ名 | パス | 概要 |
|---|---|---|
| ホーム | `/` | 今月の予算実績サマリー・未締めアラート・進行中行事ウィジェット |
| **予算管理** | | |
| 予算科目管理 | `/budget/items` | CSVインポート・科目ツリー表示・編集 |
| 実績割り振り | `/budget/assign` | 実績D&D割り振り画面（メイン操作画面） |
| 実績一覧 | `/budget/actuals` | 実績の検索・絞り込み・一覧 |
| **決算管理** | | |
| 月次決算 | `/closing/monthly` | 月次締め処理・進捗一覧 |
| 年度決算 | `/closing/annual` | 年度締め処理・最終報告書 |
| **報告書** | | |
| 予算執行状況 | `/reports/execution` | 予算・実績・補正後・執行率の一覧表 |
| 月次報告書 | `/reports/monthly` | 月次帳票（画面/PDF/Excel） |
| 年度報告書 | `/reports/annual` | 年度帳票（画面/PDF/Excel） |
| **行事計画** | | |
| 行事一覧 | `/events/plan` | 行事（event/purpose）の登録・管理・予算配分・仮押さえ確認 |
| 行事詳細 | `/events/plan/:id` | 予算配分・支払計画・実績紐付け状況 |
| ※旅費精算 | ~~`/events/expense`~~ | 独立ページなし。実績割り振り画面（`/budget/assign`）に行事フィルタで統合 |
| **基金** | | |
| 基金管理 | `/funds` | 基金一覧・残高確認 |
| 基金取引 | `/funds/:id` | 積立・取崩の記録 |
| **設定** | | |
| 会計年度設定 | `/settings/fiscal-years` | 会計年度の作成・管理 |
| ユーザー設定 | `/settings/users` | ユーザー情報・パスワード変更 |

### 画面遷移（主要フロー）

```
ログイン
  └─▶ ホーム（未締めアラート確認）
        ├─▶ 実績割り振り（毎月の主作業）
        │     ├─ CSVインポート
        │     └─ D&D割り振り
        ├─▶ 月次決算（月末処理）
        │     └─ 締め実行 → 月次報告書
        └─▶ 年度決算（年1回）
              └─ 締め実行 → 年度報告書
```

---

## 5. API設計

### 共通仕様

| 項目 | 仕様 |
|---|---|
| ベースURL | `/api/v1` |
| データ形式 | JSON |
| 認証 | `Authorization: Bearer <token>` ヘッダー |
| エラー形式 | `{ "error": { "code": "...", "message": "..." } }` |

### 認証

| メソッド | パス | 概要 |
|---|---|---|
| POST | `/auth/login` | ログイン・JWT発行 |
| POST | `/auth/refresh` | アクセストークン更新 |
| POST | `/auth/logout` | ログアウト |

### 会計年度

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years` | 会計年度一覧 |
| POST | `/fiscal-years` | 会計年度作成 |
| GET | `/fiscal-years/:id` | 会計年度詳細 |
| PUT | `/fiscal-years/:id` | 会計年度更新 |

### ダッシュボード

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/dashboard` | ホーム画面表示用。当月予算実績サマリー・進行中行事ウィジェットデータを返す |

### 予算科目

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/budget-items` | 科目ツリー取得 |
| POST | `/fiscal-years/:fyId/budget-items/import` | CSVインポート |
| POST | `/fiscal-years/:fyId/budget-items` | 科目手動追加 |
| PUT | `/budget-items/:id` | 科目更新 |
| DELETE | `/budget-items/:id` | 科目削除 |

### 予算配分（当初・補正・暫定）

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/budget-allocations` | 配分一覧（形態別） |
| POST | `/fiscal-years/:fyId/budget-allocations` | 配分作成（補正予算追加等） |
| PUT | `/budget-allocations/:id` | 配分更新 |

### 実績

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/actuals` | 実績一覧（フィルタ・ページング） |
| POST | `/fiscal-years/:fyId/actuals/import` | CSVインポート |
| PATCH | `/actuals/:id/assign` | 予算科目への割り振り（1件） |
| PATCH | `/actuals/assign-bulk` | 予算科目への一括割り振り |
| PATCH | `/actuals/:id/unassign` | 割り振り解除 |
| POST | `/actuals/discord` | Discord Bot からの現金精算登録（APIキー認証） |

### 決算

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/closings/monthly` | 月次締め状況一覧 |
| POST | `/fiscal-years/:fyId/closings/monthly` | 月次締め実行 |
| GET | `/fiscal-years/:fyId/closings/annual` | 年度締め状況 |
| POST | `/fiscal-years/:fyId/closings/annual` | 年度締め実行 |

### 報告書

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/fiscal-years/:fyId/reports/execution` | 予算執行状況（全科目） |
| GET | `/fiscal-years/:fyId/reports/monthly/:year/:month` | 月次報告書データ |
| GET | `/fiscal-years/:fyId/reports/monthly/:year/:month/pdf` | 月次PDF出力 |
| GET | `/fiscal-years/:fyId/reports/monthly/:year/:month/excel` | 月次Excel出力 |
| GET | `/fiscal-years/:fyId/reports/annual` | 年度報告書データ |
| GET | `/fiscal-years/:fyId/reports/annual/pdf` | 年度PDF出力 |
| GET | `/fiscal-years/:fyId/reports/annual/excel` | 年度Excel出力 |

### 基金

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/funds` | 基金一覧 |
| POST | `/funds` | 基金作成 |
| GET | `/funds/:id` | 基金詳細・残高 |
| GET | `/funds/:id/transactions` | 取引履歴一覧（フィルタ・ページング） |
| POST | `/funds/:id/transactions` | 積立・取崩の記録 |

### 行事計画

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/events` | 行事一覧 |
| POST | `/events` | 行事登録 |
| GET | `/events/:id` | 行事詳細 |
| PUT | `/events/:id` | 行事更新 |
| PATCH | `/events/:id/status` | ステータス更新 |
| GET | `/events/:id/payment-plans` | 支払計画一覧 |
| POST | `/events/:id/payment-plans` | 支払計画登録 |
| PATCH | `/events/:id/payment-plans/:planId/link` | 実績紐付け |
| GET | `/events/:id/budget-allocations` | 予算配分一覧 |
| POST | `/events/:id/budget-allocations` | 予算配分登録 |

---

## 6. 行事計画モジュール設計

> req-04（行事・旅費要件）確定に基づく設計。指摘No.2対応。

### DBテーブル

命名規則: `通し番号_ローマ字表記`（マスターM・トランザクションT）

#### 03_gyoji（行事M）

| カラム名 | 型 | 説明 |
|---|---|---|
| id | INT PK | |
| kaikei_id | INT FK | 会計年度ID |
| name | VARCHAR | 行事名 |
| type | ENUM | `event`（行事）/ `purpose`（目的別） |
| start_date | DATE | 開始日 |
| end_date | DATE | 終了日 |
| status | ENUM | `keikakuchu`（計画中）/ `kariosaeChu`（仮押さえ中）/ `jikkochu`（実行中）/ `kanryo`（完了） |
| memo | TEXT | 備考 |

#### 04_shiharaikeikaku（支払計画T）

| カラム名 | 型 | 説明 |
|---|---|---|
| id | INT PK | |
| gyoji_id | INT FK | 行事ID |
| yoteibi | DATE | 支払予定日 |
| kingaku | DECIMAL | 金額 |
| naiyou | VARCHAR | 支払内容 |
| shiharaite | VARCHAR | 支払先 |
| actual_id | INT FK NULL | 実績紐付け後に設定 |

#### 05_gyojihaibun（行事予算配分T）

| カラム名 | 型 | 説明 |
|---|---|---|
| id | INT PK | |
| gyoji_id | INT FK | 行事ID |
| budget_item_id | INT FK | 予算科目ID |
| kingaku | DECIMAL | 配分金額 |
| henkoukubun | ENUM | `nashi`（変更なし）/ `bunkatsu`（分割）/ `ryuyo`（流用）/ `shinki`（新規） |
