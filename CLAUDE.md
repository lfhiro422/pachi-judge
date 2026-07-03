このプロジェクトは「pachi-judge」というパチスロ判定PWAアプリの開発プロジェクトです。

【技術スタック】
- Next.js（PWA）, TypeScript, Tailwind CSS
- ホスティング: Vercel
- DB: Googleスプレッドシート（Sheets API）
- 判定AI: Anthropic Claude API（vision入力）

【現在の開発状況】(2026/07/03時点)
- ✅ VS Codeのフォルダー信頼設定：完了
- ✅ Next.jsのPWA骨格：完了（ノートPC・デスクトップPC両方に反映済み）
- ✅ GitHubリポジトリ作成・push：完了
- ✅ Vercelデプロイ：成功（Production環境でReady）
- ✅ Claude Vision API連携：ローカル・本番とも動作確認済み（/api/judge）
- ✅ 機種マスタ・機種ルール詳細：パチスロ5機種分、実データ登録済み
  （北斗の拳2023, 北斗の拳転生の章2, 化物語2025, 東京喰種2025, 炎炎ノ消防隊2 2026）
- 🔄 進行中：機種データ半自動登録機能（攻略サイトの内容→AI構造化→人が確認→
  Google Sheetsへ自動追記）
  - コード実装済み：lib/sheets.ts, lib/machine-schema.ts,
    app/api/admin/extract-machine, app/api/admin/commit-machine,
    app/admin/add-machine
  - Googleサービスアカウント(pachi-judge-sheets-writer)作成済み
  - Google Sheets API有効化済み
  - 組織ポリシー(サービスアカウントキー作成禁止)を pachi-judge
    プロジェクト限定で解除済み
  - 未完了：JSONキーのダウンロード → .env.local設定 →
    スプレッドシートへ編集者権限付与 → 動作確認

【次のアクション】
1. サービスアカウントのJSONキーを作成・ダウンロード
2. .env.local に GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY /
   GOOGLE_SHEETS_SPREADSHEET_ID を設定
3. スプレッドシートをサービスアカウントのメールアドレスに「編集者」共有
4. ローカルで /admin/add-machine の動作確認
5. Vercel環境変数にも同じ値を設定し、本番デプロイ
6. 実際にホールでテストマーケティングを開始

【判定ロジックの大原則】
- 場面A（着席前）と場面B（やめ時）を分けて判定
- GO / STAY / STOPの信号機UI
- 機種データはGoogleスプレッドシートから参照し、AIの記憶で補わない
- 設定差は使わない（MVP方針）
- パチンコは一旦先送り、パチスロのみでシステム構築中

【スプレッドシートURL】
https://docs.google.com/spreadsheets/d/1Dxi3RWtjePPUGTpdKI5e_ORFLh2FMllFxkzVp0FJAnA/edit

【運用ルール（機種データ入力時）】
- 数値や条件など「事実」だけを書く。攻略サイトの文章をそのままコピペしない
- 半自動入力フロー：攻略サイトを見る→AIに渡して構造化抽出→人が確認→追記
- 「最終確認日」は必ず入れる