# 詳細設計書 - ディレクトリ構成

> **プロジェクト**: ADAMS Lite | **最終更新**: 2026-02-27
> **← [目次に戻る](../index.md)**

---

## 6. ディレクトリ構成

```
/（ワークツリーのルート）
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   └── nginx.conf
│
├── discord-bot/                   # Discord Bot（独立プロセス）
│   ├── src/
│   │   ├── commands/              # スラッシュコマンド定義（/setevent 等）
│   │   ├── handlers/              # メッセージ処理・タイムアウト管理
│   │   └── api/                   # ADAMS Lite API クライアント（axios 等）
│   └── package.json
│                                  # ※ DBに直接アクセスしない。REST API経由で書き込む
│
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── components/            # 共通UIコンポーネント
│   │   │   ├── ui/                # 基本コンポーネント（Button, Input等）
│   │   │   └── layout/            # レイアウトコンポーネント
│   │   ├── pages/                 # ページコンポーネント
│   │   │   ├── Home/
│   │   │   ├── Budget/            # 予算管理
│   │   │   ├── Closing/           # 決算管理
│   │   │   ├── Reports/           # 報告書
│   │   │   ├── Travel/            # 旅費
│   │   │   ├── Funds/             # 基金
│   │   │   └── Settings/          # 設定
│   │   ├── hooks/                 # カスタムフック
│   │   ├── api/                   # APIクライアント（axios等）
│   │   ├── store/                 # 状態管理
│   │   ├── types/                 # 型定義（共通）
│   │   └── utils/                 # ユーティリティ
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                       # Express API（モジュラーモノリス）
│   ├── src/
│   │   ├── modules/               # 機能モジュール
│   │   │   ├── budget/            # 予算管理
│   │   │   │   ├── budget.routes.ts
│   │   │   │   ├── budget.controller.ts
│   │   │   │   └── budget.service.ts
│   │   │   ├── closing/           # 決算管理
│   │   │   ├── travel/            # 旅費
│   │   │   ├── funds/             # 基金
│   │   │   └── reports/           # 報告書
│   │   ├── shared/                # 共通処理
│   │   │   ├── auth/              # JWT認証ミドルウェア
│   │   │   ├── errors/            # エラーハンドリング
│   │   │   └── types/             # 共通型定義
│   │   └── app.ts                 # Expressアプリ本体
│   ├── prisma/
│   │   ├── schema.prisma          # DBスキーマ定義
│   │   └── migrations/            # マイグレーションファイル
│   └── package.json
│
└── ClaudeCode/                    # プロジェクトドキュメント
    ├── CLAUDE.md
    ├── README.md
    └── docs/
        ├── index.md               # 全体目次
        ├── basic-design.md        # 基本設計書
        ├── requirements/          # 要件定義（章ごとに分割）
        │   ├── req-01-overview.md     # 1〜3章: システム概要・利用者・会計制度
        │   ├── req-02-yosan.md        # 4章: 予算管理モジュール
        │   ├── req-03-kessan.md       # 5章: 決算管理モジュール
        │   ├── req-04-ryoko.md        # 6章: 旅行計画モジュール
        │   ├── req-05-ryohi.md        # 7章: 旅費精算モジュール
        │   ├── req-06-genkin.md       # 8章: 現金精算即時連携モジュール
        │   └── req-07-misc.md         # 9〜11章: データ移行・非機能要件・未決定事項
        └── detailed-design/       # 詳細設計（章ごとに分割）
            ├── design-01-database.md  # 1章: DB設計
            ├── design-02-kamoku.md    # 2章: 科目コード体系
            ├── design-03-csv.md       # 3章: CSVフォーマット仕様
            ├── design-04-screen.md    # 4章: 画面設計
            ├── design-05-process.md   # 5章: 処理フロー
            ├── design-06-directory.md # 6章: ディレクトリ構成（このファイル）
            ├── design-07-libraries.md # 7章: 使用ライブラリ
            └── design-08-pending.md   # 8章: 未決定事項
```
