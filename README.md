# 有限会社かにわ 仕入・見積管理

```
purchasing-system/
├── frontend/     # React (Vite)
├── backend/      # Express API (+ serves frontend from backend/public)
└── .github/workflows/deploy.yml
```

## Local

```bash
# DB
CREATE DATABASE kaniwa_purchasing;

# Backend  → http://localhost:8000
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend → http://localhost:8080
cd frontend && cp .env.example .env && npm install && npm run dev
```

Login: `admin@kaniwaseika.com` / `Admin123!`

On startup the backend creates missing tables, runs SQL migrations, then seeds if empty.

```bash
# Manual seed (after npm run build on VPS)
cd backend && npm run seed
cd backend && npm run seed -- --force   # re-insert safe upserts

# Manual migrations only
cd backend && npm run migrate

# Local without build
cd backend && npm run seed:dev
cd backend && npm run migrate:dev
```

Schema changes for production must go in `backend/sql/migrations/` (numbered SQL, safe for real data).

## Deploy (GitHub Actions → VPS)

Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DEPLOY_PATH`, `PM2_APP`

On VPS: clone repo to `DEPLOY_PATH`, create `backend/.env` (`SERVER_PORT=5000`, DB, JWT), install Node + pm2.  
Point nginx at `http://127.0.0.1:5000` for `app.kaniwaseika.com` (Express serves UI + `/api`).

Push to `main` → pull → build frontend with relative `/api` → copy to `backend/public` → build backend → pm2 restart → health check.
