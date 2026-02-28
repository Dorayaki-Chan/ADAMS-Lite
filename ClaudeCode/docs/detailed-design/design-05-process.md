# 詳細設計書 - 処理フロー

> **プロジェクト**: ADAMS Lite | **最終更新**: 2026-02-27
> **← [目次に戻る](../index.md)**

---

## 5. 処理フロー

### 5.1 CSVインポートフロー

```
[ユーザー] ファイル選択・アップロード
    ↓
[Backend] CSV パース
    ↓
[Backend] バリデーション
    ├─ エラーあり → エラー一覧を返却（ロールバック）
    └─ OK
         ↓
[Backend] プレビューデータを返却
    ↓
[ユーザー] プレビュー確認 → 「インポート実行」
    ↓
[Backend] DB への一括 INSERT（既存データとの重複チェック）
    ↓
[ユーザー] 完了通知
```

### 5.2 D&D割り振りフロー

```
[ユーザー] 左ペインで実績を複数選択
    ↓
[ユーザー] 右ペインの科目箱へドラッグ＆ドロップ
    ↓
[Frontend] PATCH /api/v1/actuals/assign-bulk
           body: { actual_ids: [1, 2], budget_item_id: 42 }
    ↓
[Backend] 対象月の 08_getsukikanryo が 'pending' か確認
    ├─ 'closed' → 422 エラー（締め済みデータは変更不可）
    └─ 'pending'
          ↓
[Backend] 06_shiharaijisseki.budget_item_id / status を更新
    ↓
[Frontend] 科目箱の実績累計・残額をリアルタイム更新
```

### 5.3 月次締めフロー

```
[ユーザー] 月次決算画面で対象月を選択 → 「締め実行」
    ↓
[Backend] 対象月に未割当実績（status='unassigned'）がないか確認
    ├─ あり → 警告表示（強制締め or キャンセル選択）
    └─ なし（or 強制選択）
          ↓
[Backend] 対象月の全実績を 06_shiharaijisseki.status = 'confirmed' に更新
[Backend] 08_getsukikanryo.status = 'closed' に更新
    ↓
[ユーザー] 月次報告書の表示・PDF/Excel出力
```

### 5.4 基金積立フロー（一般会計 → 基金）

```
[ユーザー] 実績割り振り画面で一般会計の歳出実績を「基金積立金」科目に割り振り
    ↓
[Backend] 06_shiharaijisseki.budget_item_id = 基金積立金科目 に更新
    ↓
[ユーザー] 基金管理画面で「積立」を記録
           入力: 対象基金、積立額、日付、メモ
    ↓
[Backend] 09_kikintorihiki レコード作成（type='deposit'）
          deposit_actual_id = 対応する歳出実績のID
```

### 5.5 基金取崩→特別会計歳入フロー（方式B統一）

```
[ユーザー] 基金管理画面で「取崩」を選択
           入力: 対象基金、取崩額、繰入先特別会計、日付、メモ
    ↓
[Backend] 09_kikintorihiki レコード作成（type='withdrawal'）
    ↓
[Backend] 繰入先特別会計に 06_shiharaijisseki レコードを自動作成
           fiscal_year_id = 指定した特別会計の年度ID
           direction = 'revenue'
           raw_category = '基金繰入収入'
           withdrawal_actual_id = 作成した 09_kikintorihiki.id
    ↓
[ユーザー] 特別会計の割り振り画面で
          「歳入 > 基金繰入収入」科目に自動割り当て（確認・修正可）
    ↓
[ユーザー] 特別会計の歳出実績を通常通りCSVインポート → 科目に割り振り
```

### 5.6 暫定予算自動計算フロー

```
[ユーザー] 会計年度設定で「暫定予算作成」を選択
           入力: 暫定期間（月数）
    ↓
[Backend] 05_yosankamoku.is_provisional_target = true の科目を抽出
[Backend] 前年度の各科目の実績合計（06_shiharaijisseki）を集計
[Backend] 暫定予算額 = 前年度実績合計 × (月数 ÷ 12) を計算
    ↓
[Backend] 04_yosanhaibun レコードを一括作成
           budget_type = 'provisional'
    ↓
[ユーザー] プレビュー確認 → 「確定」で保存
```
