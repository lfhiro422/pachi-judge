【現在の開発状況】(2026-07-04 更新)
- Next.js PWA骨格、GitHub push、Vercelデプロイ：完了・本番稼働中(https://pachi-judge.vercel.app)
- Claude Vision API連携（/api/judge）：本番稼働中
- パチスロ5機種の実データ登録（機種マスタ・機種ルール詳細）：完了
- Google Sheets API連携：完了。lib/sheets.ts に appendRows / machineIdExists を実装済み、
  googleapis パッケージ導入済み
- 機種データ半自動登録機能（/admin/add-machine）：本番反映済み・動作確認待ち
- GitHubリポジトリ：https://github.com/lfhiro422/pachi-judge （public）

【今後の運用ルール（重要・繰り返し発生した事故の再発防止）】
- ノートPCとデスクトップPCの2台で作業しているため、
  作業開始前に必ず `git pull`、作業終了前に必ず `git push` を行うこと。
  これを怠ったことが原因で、admin機能一式が一時的に本番ブランチの履歴から
  消えていたことがあった（後日 a89e3ab で復元）。
- pushしても、Vercelの自動デプロイが必ず成功するとは限らない
  （TypeScriptのビルドエラーで "ERROR" 状態になることがある）。
  push後は必ずVercelダッシュボードでデプロイ状態とビルドログを確認すること。
- .env.local はGit管理外のためPCごとに再設定が必要。
- APIキーや秘密鍵は、画面共有・スクリーンショット・チャットに一切映さないこと。
- 機種データ半自動登録機能（/admin/add-machine）：本番反映済み・Basic認証で保護済み
  （ADMIN_BASIC_USER / ADMIN_BASIC_PASSWORD をVercel環境変数に設定）
- 【注意】ログイン時、通常ブラウザだとパスワードマネージャーの自動入力が誤作動する
  ことがあった。ログインできない場合はシークレットウィンドウか手打ち入力を試すこと。