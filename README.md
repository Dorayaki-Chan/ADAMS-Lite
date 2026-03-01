# ADAMS Lite

## 概要
我が家では財政原則に基づいた家計運用を行っています。
予算執行・決算といった官庁会計システムの対象業務に加えて、行事計画・旅費精算といった旅費システムが対象とする業務機能、さらに外出先からの現金支払い即時登録（Discord連携）を導入し、会計業務を一元的に行えるシステムを構築することを目指しています。

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [ドキュメント目次](ClaudeCode/docs/index.md) | 全ドキュメント一覧 |
| [基本設計書](ClaudeCode/docs/basic-design.md) | システム構成・コンテナ・技術スタック・ページ構成・API設計 |
| [要件定義書（概要）](ClaudeCode/docs/requirements/req-01-overview.md) | システム要件・会計制度 |

## 使用技術

| 区分 | 技術 |
|---|---|
| フロントエンド | React + TypeScript（Vite） |
| バックエンド | Node.js + Express + TypeScript |
| ORM | Prisma |
| データベース | MySQL 8.0 |
| インフラ | Docker / Docker Compose |
| リバースプロキシ | nginx |
| Discord Bot | Discord.js |

## システム構成

ADAMS Liteは**モジュラーモノリス**構成を採用しています。
各機能はコード上でモジュールとして明確に分離しつつ、バックエンドサーバーは1つに統合することで、個人・家庭での運用・保守を容易にしています。
Discord BotはDocker Compose内の独立コンテナ（`discord-bot`）として動作し、ADAMS LiteのREST APIを経由してDBに書き込みます。自宅のUGREEN NAS上でDocker Composeにより他サービスと一元管理します。

- 予算管理モジュール: 予算の設定、管理、実績の追跡を行います。
- 決算管理モジュール: 決算処理、報告書の生成を行います。
- 行事計画モジュール: 行事の計画、予算の設定を行います。
- 旅費精算モジュール: 旅費の精算、報告書の生成を行います。
- 現金精算即時連携モジュール: Discord経由で外出先の現金支払いを即時登録します。

### コンテナ構成

```
【Docker Compose】
nginx（リバースプロキシ）
  ├── frontend（React SPA）
  ├── backend（Express API）
  │     ├── budget モジュール（予算管理）
  │     ├── closing モジュール（決算管理）
  │     ├── events モジュール（行事計画）
  │     ├── funds モジュール（基金）
  │     └── reports モジュール（報告書）
  ├── db（MySQL 8.0）
  └── discord-bot（Discord Bot コンテナ）
        └── backend（POST /api/v1/actuals/discord）経由でDB書き込み
```
