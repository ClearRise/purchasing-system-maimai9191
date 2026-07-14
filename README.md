# 有限会社かにわでは 仕入・見積管理システム

MERN-style stack: **React + MUI + Tailwind** (frontend), **Node + Express + PostgreSQL** (backend).

## 機能

- ユーザー管理・ロール別権限（管理者 / 仕入 / 営業）
- マスタ管理（発注先・店舗・商品・得意先）
- 月別仕入価格入力・仕入先比較・履歴
- 見積書自動生成・編集・送信ステータス
- 見積シミュレーション
- ダッシュボード（ランキング・アラート）
- システム設定（ランク別粗利率）

## セットアップ

### 1. PostgreSQL

```sql
CREATE DATABASE kaniwa_purchasing;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# .env を編集（DB接続情報）
npm install
npm run dev
```

API: http://localhost:8000

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

UI: http://localhost:8080

## 初期ログイン

| 項目 | 値 |
|------|-----|
| メール | admin@kaniwa.local |
| パスワード | Admin123! |

## ディレクトリ構成

```
purchasing-system/
├── backend/src/
│   ├── config/       DB, seed, constants
│   ├── models/       Sequelize models
│   ├── services/     Business logic
│   ├── controllers/  HTTP handlers
│   ├── routes/       API routes
│   └── middlewares/  Auth, RBAC, validation
└── frontend/src/
    ├── pages/        Screen components
    ├── components/   Layout, shared UI
    ├── store/        Redux (auth)
    ├── hooks/        Permissions
    └── theme/        MUI theme (日本語UI)
```
