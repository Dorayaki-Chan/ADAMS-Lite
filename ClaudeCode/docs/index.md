# ADAMS Lite ドキュメント目次

**プロジェクト**: ADAMS Lite（家計版官庁会計システム）
**最終更新**: 2026-03-02

---

## ドキュメント一覧

### 基本設計書
- [basic-design.md](./basic-design.md) — システム全体のアーキテクチャ・技術選定・ページ構成・API設計・行事計画モジュール設計

---

### 要件定義書（章ごとに分割）

| ファイル | 内容 |
|---|---|
| [req-01-overview.md](./requirements/req-01-overview.md) | システム概要・利用者・認証・会計制度 |
| [req-02-yosan.md](./requirements/req-02-yosan.md) | 予算管理モジュール（科目体系・CSV・割り振り画面） |
| [req-03-kessan.md](./requirements/req-03-kessan.md) | 決算管理モジュール（月次締め・年度締め・報告書） |
| [req-04-ryoko.md](./requirements/req-04-ryoko.md) | 旅行計画モジュール（行事計画・仮押さえ） |
| [req-05-ryohi.md](./requirements/req-05-ryohi.md) | 旅費精算モジュール（割り振り画面統合） |
| [req-06-genkin.md](./requirements/req-06-genkin.md) | 現金精算即時連携モジュール（Discord連携） |
| [req-07-misc.md](./requirements/req-07-misc.md) | データ移行・非機能要件・未決定事項 |

---

## テーブル命名規則

`通し番号_ローマ字表記`（マスターM / トランザクションT）

| テーブル名 | 内容 |
|---|---|
| 01_user | ユーザーM |
| 02_kaikei | 会計M |
| 03_gyoji | 行事M |
| 04_shiharaikeikaku | 支払計画T |
| 05_gyojihaibun | 行事予算配分T |

---
