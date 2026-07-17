import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SERVER_PORT = process.env.SERVER_PORT || 8000;
export const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
export const DB_NAME = process.env.DB_NAME || 'kaniwa_purchasing';
export const DB_USER = process.env.DB_USER || 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
export const DB_DIALECT = process.env.DB_DIALECT || 'postgres';
export const DB_SSL = process.env.DB_SSL === 'true';

export const USER_ROLES = ['admin', 'purchase', 'sales'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CUSTOMER_RANKS = ['A', 'B', 'C', 'D', 'N'] as const;
export type CustomerRank = (typeof CUSTOMER_RANKS)[number];

export const DEFAULT_PRODUCT_UNITS = ['PC', 'kg', 'case', 'hon', 'CS', 'tama'] as const;
/** @deprecated Prefer lookup_options; kept for seed defaults only */
export const PRODUCT_UNITS = DEFAULT_PRODUCT_UNITS;
export type ProductUnit = string;

export const QUOTATION_STATUSES = ['draft', 'confirmed', 'sent'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
