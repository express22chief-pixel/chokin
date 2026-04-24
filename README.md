# 家計簿トラッカー

年間の支出目標を立てて、日々の支出を管理するPWAアプリ。

## 機能
- 期間ごとの予算設定(年の途中から開始も可)
- 日/週/月ペースのビジュアル比較
- カテゴリ別支出管理
- 月単位の履歴閲覧、検索、フィルター
- ホーム画面にインストール可能(PWA)
- データはブラウザのlocalStorageに保存

## 開発
```bash
npm install
npm run dev
```

## ビルド
```bash
npm run build
```

## デプロイ手順(GitHub + Vercel)

### 1. GitHubにプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### 2. Vercelにデプロイ
1. [vercel.com](https://vercel.com) にログイン(GitHubアカウントでサインイン可)
2. 「Add New Project」→ GitHubリポジトリをインポート
3. Framework Preset: `Vite` が自動で検出される
4. そのまま「Deploy」をクリック

数十秒でデプロイ完了。生成されたURLにスマホからアクセスし、Safariの「共有」→「ホーム画面に追加」でアプリとしてインストールできる。

## データについて
- 支出データはブラウザの `localStorage` に保存される
- 別端末とは同期しない
- ブラウザのデータをクリアすると消える
