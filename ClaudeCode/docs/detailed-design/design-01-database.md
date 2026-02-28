# 詳細設計書 - データベース設計

> **プロジェクト**: ADAMS Lite | **最終更新**: 2026-02-28
> **← [目次に戻る](../index.md)**

---

## 1. データベース設計

### ER図（概要）

```
07_kyotsuteisuteigi（共通定数等定義M）
 ├── 05_yosankamoku.fiscal_year_code を参照（区分コード01: 会計年度）
 ├── 05_yosankamoku.shokan_code を参照（区分コード02: 所管）
 └── 05_yosankamoku.code の款/項/目コードの採番元（区分コード03〜05）

01_user（ユーザーM）
 └──< 02_kaikei（会計M）
        ├──< 05_yosankamoku（予算科目M ※自己参照ツリー）
        │      └──< 04_yosanhaibun（予算配分T: 当初/補正/暫定）
        ├──< 06_shiharaijisseki（支払実績T）
        │      ├── 05_yosankamoku（割り振り先、nullable）
        │      └── 10_gyojikeikaku（行事紐付け・事項、nullable）
        ├──< 08_getsukikanryo（月次完了T）
        └──< 10_gyojikeikaku（行事計画M）
               └──< 11_gyojiyosanhaibun（行事予算配分T）
                      └── 05_yosankamoku（対象科目・目レベル）

03_kikin（基金M）
 └──< 09_kikintorihiki（基金取引T）
        └── 06_shiharaijisseki（関連実績、nullable）
```

---

### テーブル定義

#### 01_user（ユーザーM）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL | 表示名 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | ログインID |
| password_hash | VARCHAR(255) | NOT NULL | bcryptハッシュ |
| role | ENUM('admin','member') | NOT NULL, DEFAULT 'admin' | 権限（マルチユーザー対応用） |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

#### 02_kaikei（会計M）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → 01_user.id | 作成ユーザー |
| type | ENUM('general','special') | NOT NULL | 一般会計 / 特別会計 |
| name | VARCHAR(100) | NOT NULL | 例: 令和7年度 一般会計 |
| description | TEXT | NULL | 趣旨・目的・備考（例: ふるさと納税の受入・執行を管理する特別会計） |
| start_date | DATE | NOT NULL | 開始日（一般会計: 4/1） |
| end_date | DATE | NOT NULL | 終了日（一般会計: 翌年3/31） |
| status | ENUM('active','closed') | NOT NULL, DEFAULT 'active' | 締め状態 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

#### 05_yosankamoku（予算科目M）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| fiscal_year_id | INT | FK → 02_kaikei.id | 会計年度（リレーション用） |
| fiscal_year_code | VARCHAR(4) | NOT NULL | 会計年度コード（例: `2026`）07_kyotsuteisuteigi より |
| shokan_code | VARCHAR(2) | NOT NULL | 所管コード（例: `01`）07_kyotsuteisuteigi より |
| parent_id | INT | FK → 05_yosankamoku.id, NULL | 親科目（自己参照） |
| direction | ENUM('revenue','expenditure') | NOT NULL | 歳入 / 歳出 |
| level | ENUM('款','項','目') | NOT NULL | 階層レベル |
| code | VARCHAR(10) | NOT NULL | 科目コード `KK-KO-MMM`（例: `01-01-001`）インポート時に 07_kyotsuteisuteigi 参照で自動採番 |
| name | VARCHAR(100) | NOT NULL | 科目名 |
| description | TEXT | NULL | 科目の説明・備考（CSVの第6列から取得） |
| sort_order | INT | NOT NULL, DEFAULT 0 | 表示順 |
| is_provisional_target | BOOLEAN | NOT NULL, DEFAULT FALSE | 暫定予算計算の対象か |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

**インデックス**: `(direction, fiscal_year_code, shokan_code, code)` UNIQUE

> **code の形式**: `款コード(2桁)-項コード(2桁)-目コード(3桁)`
> 目が「なし」の科目（他会計受入 等）は目コードを `000` とし項レベルを最下位とする（例: `03-05-000`）
> 年度横断クエリは `fiscal_year_code` でグループ化、科目比較は `code` の一致で行う
> **旧テーブル名**: `budget_items`（英語名から命名規則に変更）

---

#### 04_yosanhaibun（予算配分T）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| budget_item_id | INT | FK → 05_yosankamoku.id | 対象科目（目/項レベル原則。款レベルは参考値として登録可） |
| fiscal_year_id | INT | FK → 02_kaikei.id | |
| budget_type | ENUM('original','supplementary','provisional') | NOT NULL | 当初 / 補正 / 暫定 |
| supplementary_number | INT | NULL | 補正予算の号数（補正時のみ） |
| amount | DECIMAL(12,0) | NULL | 予算額（補正は増減額・マイナス可。NULL=未設定。款レベル参考値も可） |
| effective_date | DATE | NOT NULL | 適用日 |
| description | VARCHAR(200) | NULL | 備考（例: 令和7年度補正予算第1号） |
| created_at | DATETIME | NOT NULL | |

**現行予算額の計算**:
```sql
SELECT COALESCE(SUM(amount), 0) AS current_budget
FROM 04_yosanhaibun
WHERE budget_item_id = ? AND fiscal_year_id = ?
-- ※ 集計対象は 05_yosankamoku.level='目' または 目なし項（code LIKE '%-000'）のみ
-- ※ 款レベルの budget_item_id に紐付くレコードは参考値のため呼び出し側で除外
```
> **amount=NULL**: 未設定（CSVで予算額が空白だったもの）。SUM は NULL を自動無視するため集計に影響なし。
> **amount=0**: 明示的な0円。集計対象。
> **款レベル参考値**: UI上は「参考: ○○円」として表示。執行率・残額の計算には含めない。
> **事項あり目の予算額（積算方式 / 案A採用）**: `11_gyojiyosanhaibun` にレコードが存在する目（事項あり目）の予算額は `SUM(11_gyojiyosanhaibun.amount WHERE budget_item_id = 対象目)` から自動計算する。当該目の `04_yosanhaibun` レコードは作成しない（国の予算書と同様、事項合計 = 目合計）。事項なしの目（食費・住居費等）は従来どおり `04_yosanhaibun` を直接設定する。

---

#### 06_shiharaijisseki（支払実績T）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| fiscal_year_id | INT | FK → 02_kaikei.id | |
| budget_item_id | INT | FK → 05_yosankamoku.id, NULL | 割り振り先科目（未割当はNULL） |
| event_id | INT | FK → 10_gyojikeikaku.id, NULL | 紐付け行事（事項）。NULL=事項なし |
| direction | ENUM('revenue','expenditure') | NOT NULL | 歳入 / 歳出 |
| date | DATE | NOT NULL | 収支日 |
| amount | DECIMAL(12,0) | NOT NULL | 金額 |
| raw_category | VARCHAR(100) | NULL | CSV元の分類（参照用） |
| note | TEXT | NULL | メモ |
| status | ENUM('unassigned','assigned','confirmed') | NOT NULL, DEFAULT 'unassigned' | 割り振り状態 |
| imported_at | DATETIME | NOT NULL | CSVインポート日時 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

#### 08_getsukikanryo（月次完了T）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| fiscal_year_id | INT | FK → 02_kaikei.id | |
| target_year | INT | NOT NULL | 対象年（例: 2026） |
| target_month | INT | NOT NULL | 対象月（1〜12） |
| status | ENUM('pending','closed') | NOT NULL, DEFAULT 'pending' | 締め状態 |
| closed_at | DATETIME | NULL | 締め実行日時 |
| closed_by_user_id | INT | FK → 01_user.id, NULL | 締め実行ユーザー |
| created_at | DATETIME | NOT NULL | |

**インデックス**: `(fiscal_year_id, target_year, target_month)` UNIQUE

---

#### 03_kikin（基金M）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → 01_user.id | |
| name | VARCHAR(100) | NOT NULL | 例: 住居移転関連基金 |
| description | TEXT | NULL | 説明・目的 |
| established_date | DATE | NOT NULL | 設立日 |
| status | ENUM('active','closed') | NOT NULL, DEFAULT 'active' | 状態 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

---

#### 09_kikintorihiki（基金取引T）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| fund_id | INT | FK → 03_kikin.id | |
| type | ENUM('deposit','withdrawal') | NOT NULL | 積立 / 取崩 |
| amount | DECIMAL(12,0) | NOT NULL | 金額（正の値） |
| date | DATE | NOT NULL | 取引日 |
| note | TEXT | NULL | メモ |
| deposit_actual_id | INT | FK → 06_shiharaijisseki.id, NULL | 積立時: 一般会計の歳出実績（基金積立金） |
| withdrawal_actual_id | INT | FK → 06_shiharaijisseki.id, NULL | 取崩時: 特別会計の歳入実績（基金繰入収入） |
| created_at | DATETIME | NOT NULL | |

> **方式B統一**: 積立は一般会計の歳出実績と、取崩は特別会計の歳入実績と紐付ける。

---

#### 10_gyojikeikaku（行事計画M）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| fiscal_year_id | INT | FK → 02_kaikei.id | 年度 |
| name | VARCHAR(100) | NOT NULL | 行事名（例: 社会科見学、弱男定例会） |
| type | ENUM('event','purpose') | NOT NULL | event: 旅行等大規模行事 / purpose: 繰り返し小目的 |
| start_date | DATE | NULL | 開始日（主に event 型。日帰りは end_date と同日） |
| end_date | DATE | NULL | 終了日 |
| status | ENUM('planned','tentative','active','completed') | NOT NULL, DEFAULT 'planned' | 計画中 / 仮押さえ / 実行中 / 完了 |
| description | TEXT | NULL | 備考 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

> **type='event'**: 旅行・コンサート等、日程が決まっている大型行事。start_date / end_date を持つ。
> **type='purpose'**: 弱男定例会等、日程によらず繰り返す小目的。実績に「目的」ラベルとして付与するために使用。

---

#### 11_gyojiyosanhaibun（行事予算配分T）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| event_id | INT | FK → 10_gyojikeikaku.id | 対象行事（事項） |
| budget_item_id | INT | FK → 05_yosankamoku.id | 対象予算科目（目レベル） |
| amount | DECIMAL(12,0) | NULL | 予算額（事項×目の組み合わせ単位） |
| description | VARCHAR(200) | NULL | 備考 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

**インデックス**: `(event_id, budget_item_id)` UNIQUE

> このテーブルが「目 × 事項」マトリクスの予算を保持する中核。
> 例: 社会科見学(event_id=1) × 旅行関係費>交通費(budget_item_id=X) = 15,000円
> 帳票出力の2形式（科目別・事項別）はいずれもこのテーブルを参照して事項行を展開する。
> **積算方式（案A採用）**: 同一 budget_item_id（目）に複数の事項が紐付く場合、その目の予算額は `SUM(amount) WHERE budget_item_id = 対象目` で求める。`04_yosanhaibun` には当該目の予算は登録しない。

---

#### 07_kyotsuteisuteigi（共通定数等定義M）

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| category_code | CHAR(2) | NOT NULL | 区分コード（01:会計年度 02:所管 03:款 04:項 05:目） |
| category_name | VARCHAR(50) | NOT NULL | 区分名 |
| code | VARCHAR(10) | NOT NULL | コード |
| code_name | VARCHAR(100) | NOT NULL | コード名 |
| valid_from | DATE | NOT NULL | 適用開始日 |
| valid_to | DATE | NOT NULL | 終了日（9999-12-31=無期限） |
| sort_order | INT | NOT NULL, DEFAULT 0 | 表示順 |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

**インデックス**: `(category_code, code, valid_from)` UNIQUE

**初期データ（令和7年度〜 / 令和8年度暫定科目）**

| category_code | category_name | code | code_name | valid_from | valid_to |
|---|---|---|---|---|---|
| 01 | 会計年度 | 2025 | 令和7年度 | 2025-01-01 | 9999-12-31 |
| 01 | 会計年度 | 2026 | 令和8年度 | 2026-01-01 | 9999-12-31 |
| 01 | 会計年度 | 2027 | 令和9年度 | 2027-01-01 | 9999-12-31 |
| 01 | 会計年度 | 2028 | 令和10年度 | 2028-01-01 | 9999-12-31 |
| 01 | 会計年度 | 2029 | 令和11年度 | 2029-01-01 | 9999-12-31 |
| 01 | 会計年度 | 2030 | 令和12年度 | 2030-01-01 | 9999-12-31 |
| 02 | 所管 | 01 | 山田太郎 | 2024-01-01 | 9999-12-31 |
| 03 | 款 | 01 | 所得収入 | 2024-01-01 | 9999-12-31 |
| 03 | 款 | 02 | 贈与収入 | 2024-01-01 | 9999-12-31 |
| 03 | 款 | 03 | 他会計受入 | 2024-01-01 | 9999-12-31 |
| 03 | 款 | 04 | 立替返金 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 01 | 給与 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 02 | 賞与 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 03 | その他 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 04 | 贈与 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 05 | 住居移転関連基金受入 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 06 | ふるさと納税基金受入 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 07 | 財政調整基金受入 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 08 | 旅行関係費立替返金 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 09 | 交際費立替返金 | 2024-01-01 | 9999-12-31 |
| 04 | 項 | 10 | 会社交通費立替返金 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 001 | 基本給 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 002 | 超勤手当 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 003 | 住宅手当 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 004 | 国内駐在手当 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 005 | その他手当（給与配下） | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 006 | 基本分 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 007 | 評価反映分 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 008 | DCキャッシュ | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 009 | その他手当（その他配下） | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 010 | じいじ | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 011 | ばあば | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 012 | なし（目レベル不要の科目） | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 013 | 旅行関係費 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 014 | 交際費 | 2024-01-01 | 9999-12-31 |
| 05 | 目 | 015 | 会社交通費 | 2024-01-01 | 9999-12-31 |

> **CSVインポート時**: 所管名・款名・項名・目名を 07_kyotsuteisuteigi から検索し、対応する code を取得して `05_yosankamoku.code`（KK-KO-MMM 形式）を自動生成する。
> **目「なし」の処理**: 07_kyotsuteisuteigi では 012 として管理するが、05_yosankamoku では目コードを `000` とし（例: `03-05-000`）、項レベルのレコードを最下位として扱う。
