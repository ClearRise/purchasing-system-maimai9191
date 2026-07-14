# 有限会社かにわでは 仕入・見積管理

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

Login: `admin@kaniwa.local` / `Admin123!`

## Deploy (GitHub Actions → VPS)

Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DEPLOY_PATH`, `PM2_APP`, `PUBLIC_URL`

On VPS: clone repo to `DEPLOY_PATH`, create `backend/.env`, install Node + pm2.  
Push to `main` → pull → build frontend → copy to `backend/public` → build backend → pm2 restart.
