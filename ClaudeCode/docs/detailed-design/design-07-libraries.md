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

---

### 7.2 Discord連携

| 用途 | ライブラリ | バージョン管理 | ライセンス | 実行場所 |
|---|---|---|---|---|
| Discord Bot | **discord.js** | discord-bot/package.json | Apache-2.0（無料） | discord-bot コンテナ（Docker Compose内） |

**Discord Bot の実装方針**:
- `discord.js` の最新版を使用してスラッシュコマンド（`/setevent`）とメッセージイベントを実装する
- BotはDocker Compose内の独立コンテナとして起動する（自宅UGREEN NAS上で他サービスと一元管理）
- ADAMS Lite バックエンドへの書き込みは、`axios` 等の HTTPクライアントで `POST /api/v1/actuals/discord`（APIキー認証）を呼び出す。DBへの直接アクセスは行わない

**連携フロー**:
```
[Discord] ユーザーがスレッド内に「金額 メモ」を投稿
    ↓
[discord-bot] discord.js でメッセージを受信・パース
    ↓
[discord-bot] axios で POST /api/v1/actuals/discord を呼び出し
              ヘッダー: x-api-key: <APIキー>
    ↓
[backend] 06_shiharaijisseki に source='discord' で INSERT
    ↓
[discord-bot] 登録完了をDiscordに返信
```
