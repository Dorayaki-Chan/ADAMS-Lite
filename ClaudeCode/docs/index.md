# ADAMS Lite ドキュメント目次

**プロジェクト**: ADAMS Lite（家計版官庁会計システム）
**最終更新**: 2026-02-27

---

## ドキュメント一覧

### 基本設計書
- [basic-design.md](./basic-design.md) — システム全体のアーキテクチャ・技術選定

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

### 詳細設計書（章ごとに分割）

| ファイル | 内容 |
|---|---|
| [design-01-database.md](./detailed-design/design-01-database.md) | DB設計（ER図・全テーブル定義・初期データ） |
| [design-02-kamoku.md](./detailed-design/design-02-kamoku.md) | 科目コード体系（KK-KO-MMM形式・階層対応） |
| [design-03-csv.md](./detailed-design/design-03-csv.md) | CSVフォーマット仕様（予算科目・実績） |
| [design-04-screen.md](./detailed-design/design-04-screen.md) | 画面設計（割り振り画面・帳票モックアップ） |
| [design-05-process.md](./detailed-design/design-05-process.md) | 処理フロー（CSV・D&D・月次締め・基金・暫定予算） |
| [design-06-directory.md](./detailed-design/design-06-directory.md) | ディレクトリ構成 |
| [design-07-libraries.md](./detailed-design/design-07-libraries.md) | 使用ライブラリ（@react-pdf/renderer・ExcelJS） |
| [design-08-pending.md](./detailed-design/design-08-pending.md) | 未決定事項（詳細設計レベル） |

---

## テーブル命名規則

`通し番号_ローマ字表記`（マスターM / トランザクションT）

| テーブル名 | 内容 |
|---|---|
| 01_user | ユーザーM |
| 02_kaikei | 会計M |
| 03_kikin | 基金M |
| 04_yosanhaibun | 予算配分T |
| 05_yosankamoku | 予算科目M |
| 06_shiharaijisseki | 支払実績T |
| 07_kyotsuteisuteigi | 共通定数等定義M |
| 08_getsukikanryo | 月次完了T |
| 09_kikintorihiki | 基金取引T |
| 10_gyojikeikaku | 行事計画M |
| 11_gyojiyosanhaibun | 行事予算配分T |

---

## 最優先未決定事項

1. **歳出科目体系の確定**（款・項・目の全科目）← 多くの設計に波及
2. 旅行計画モジュールのDB・画面設計（1の確定後）
3. 歳出予算科目CSVフォーマット確定（1の確定後）
