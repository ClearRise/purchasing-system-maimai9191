const raw = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

export const API_URL = raw || (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const API_BASE_URL = API_URL ? `${API_URL}/api` : '/api';

export const COMPANY_NAME = '有限会社かにわでは';
export const SITE_NAME = `${COMPANY_NAME} 仕入・見積管理`;
export const TOKEN_KEY = 'kaniwa_token';
export const CACHE_DURATION = 5 * 60 * 1000;
