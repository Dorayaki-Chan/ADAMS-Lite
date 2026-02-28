# 詳細設計書 - 使用ライブラリ（主要）

> **プロジェクト**: ADAMS Lite | **最終更新**: 2026-02-27
> **← [目次に戻る](../index.md)**

---

## 7. 使用ライブラリ（主要）

### 7.1 帳票生成

| 用途 | ライブラリ | バージョン管理 | ライセンス | 実行場所 |
|---|---|---|---|---|
| PDF出力 | **@react-pdf/renderer** | frontend/package.json | MIT（無料） | フロントエンド |
| Excel出力 | **ExcelJS** | backend/package.json | MIT（無料） | バックエンド |

**PDF生成の流れ**:
```
[React] 帳票コンポーネント（@react-pdf/renderer の Document/Page/View で定義）
    ↓
[Browser] PDFBlobをメモリ上で生成
    ↓
[Browser] ダウンロード or 新タブでプレビュー
```

**Excel生成の流れ**:
```
[Frontend] GET /api/v1/reports/excel?fiscal_year_id=1&month=1
    ↓
[Backend] ExcelJS でワークブック生成（罫線・書式・数式設定）
    ↓
[Backend] .xlsx バッファをレスポンスとして返却
    ↓
[Browser] ファイルダウンロード
```
