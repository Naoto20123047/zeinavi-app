# 確定申告ナビ（zeinavi-app）

学生向けの確定申告サポート PWA。React + TypeScript + Vite + Firebase。

## セットアップ

```bash
npm install
cp .env.example .env   # 値は Firebase コンソールから取得して記入
npm run dev
```

`.env` は Git にコミットしないこと（`.gitignore` 済み）。
必要な環境変数は `.env.example` を参照。

## ディレクトリ構成

```
src/
├── components/        画面をまたいで使う UI（アイコン・サイドバー・ボトムナビ）
│   ├── Icons.tsx      SVG アイコン定義
│   ├── Sidebar.tsx    デスクトップ用サイドバー
│   ├── BottomNav.tsx  モバイル用ボトムナビ
│   └── navigation.ts  画面ID・メニュー項目の唯一の定義元
├── config/
│   └── taxConfig.ts   税制の数値・計算式・表示ラベル（税制改正時はここだけ変更）
├── hooks/             Firestore とのやり取り
├── lib/
│   ├── env.ts         環境変数の読み込みと検証
│   ├── firebase.ts    Firebase 初期化 + App Check
│   ├── analytics.ts   Google Analytics（GA4）
│   └── ai.ts          AIチャット（Firebase AI Logic 経由の Gemini）
├── screens/           画面コンポーネント
└── utils/             税額の試算ロジック
```

Firestore のセキュリティルールは Firebase コンソール側で管理している
（リポジトリには含めない）。

## Google Analytics（GA4）

Firebase Analytics 経由で GA4 に送信する。測定ID は `.env` の
`VITE_FIREBASE_MEASUREMENT_ID` で設定し、未設定なら計測のみ無効になる。

SPA のため画面遷移は `App.tsx` から `screen_view` を手動送信している。
イベント名は `src/lib/analytics.ts` の `AnalyticsEvents` に集約しているので、
新しい計測を追加するときはまずここに定義する。

送信しているイベント：

| イベント | 発生タイミング | 主なパラメータ |
| --- | --- | --- |
| `screen_view` | 画面遷移のたび | `firebase_screen` |
| `login` / `sign_up` / `logout` | 認証 | `method` |
| `diagnosis_start` / `diagnosis_complete` | 診断フロー | `result_type`, `income_types` |
| `chat_message_sent` | AIチャット送信 | `length`, `is_quick_question` |
| `chat_limit_reached` | 1日の上限到達 | – |
| `record_added` / `record_deleted` | 収入・経費の記録 | `kind`, `type` |
| `checklist_item_toggled` / `checklist_reset` | 書類チェック | `item_id`, `checked` |
| `guide_case_viewed` | ケース別ガイド閲覧 | `case_id` |

**個人情報は送信しない。** 金額の実数・取引先名・メールアドレス・質問文そのものは
イベントパラメータに含めないこと。ユーザー識別は Firebase の uid のみを使う。

## AIチャット（Firebase AI Logic）

Gemini はブラウザから直接呼ばず、**Firebase AI Logic** 経由で呼び出す
（`src/lib/ai.ts`）。Firebase プロジェクトの認証情報で Gemini にアクセスするため、
**アプリ側に Gemini の APIキーを置く必要がない**。従量課金（Blaze）プランも不要で、
Gemini Developer API の無料枠のまま利用できる。

### Firebase コンソールでの初回設定

1. **AI Logic を有効化**
   Firebase コンソール → AI Logic → 「開始する」→ プロバイダに
   **Gemini Developer API** を選択
2. **App Check を設定**（AI Logic では必須）
   App Check → ウェブアプリを登録 → reCAPTCHA Enterprise のサイトキーを発行し、
   `.env` の `VITE_RECAPTCHA_SITE_KEY` に設定
3. ローカル開発では App Check のデバッグトークンを発行し、
   `.env` の `VITE_APPCHECK_DEBUG_TOKEN` に設定する
   （本番ビルドでは無視されるので安全）

モデルIDは `.env` の `VITE_AI_MODEL`（既定 `gemini-3.7-flash`）で差し替えられる。

### 利用回数の制限について

1日 `CHAT_DAILY_LIMIT` 回（`src/config/taxConfig.ts`）の制限は
`users/{uid}/chatUsage/today` にトランザクションで記録している。

サーバーを持たない構成のため、**クライアント側だけでは上限を完全には強制できない**。
Firestore ルール（コンソール側）で以下を設定して、リセットによる回避を防ぐこと。

- `chatUsage` は本人のみ読み書き可
- 同じ `date` のあいだ `count` は 1 ずつしか増やせない（減らす・0 に戻すのは不可）
- `count` が上限を超える書き込みは拒否

完全に強制したい場合は Cloud Functions（Blaze プラン）を挟む構成に切り替える。

### つまずいたときは

`src/lib/ai.ts` は開発時のみ生のエラーを `console.error` に出す。
ブラウザのコンソールを見れば原因を特定できる。

| 症状 | 原因と対処 |
| --- | --- |
| 「AIチャットの初期設定が完了していません」 | Firebase コンソール → AI Logic を有効化していない。下の手順を実施する |
| `firebasevertexai.googleapis.com ... are blocked` | Firebase APIキーに API 制限がかかっている。Google Cloud コンソール → 認証情報 → 対象キー → 「APIの制限」に **Firebase AI Logic API** を追加する |
| `App Check` 関連のエラー | `VITE_RECAPTCHA_SITE_KEY` が未設定、またはローカルで `VITE_APPCHECK_DEBUG_TOKEN` を設定していない |
| `First Content should be with role 'user'` | 会話履歴が user 以外で始まっている。`toGeminiHistory()` が整形するので通常は発生しない |
| 「指定したAIモデルが利用できません」 | `VITE_AI_MODEL` のモデルIDが無効。利用可能なモデルは Firebase のドキュメントを参照 |

## 税制の数値を更新するとき

`src/config/taxConfig.ts` だけを変更すればよい。
画面側に「178万円」などを直書きせず、`WALL_LABELS` や `formatMan()` を経由すること。

## ビルド・デプロイ

```bash
npm run lint
npm run build
firebase deploy
```
