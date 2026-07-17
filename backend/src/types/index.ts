import { Optional } from 'sequelize';
import { CustomerRank, ProductUnit, QuotationStatus, UserRole } from '@/config/constants';

export interface TCustomError extends Error {
  statusCode: number;
  message: string;
}

export interface IJwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface IAuthUser {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

export interface IAuthResponse {
  user: IAuthUser;
  token: string;
}

export interface IUserAttributes {
  id: number;
  email: string;
  username: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserCreationAttributes
  extends Optional<
    IUserAttributes,
    'id' | 'role' | 'isActive' | 'lastLogin' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt'
  > {}

export interface IUserPaginationOptions extends IPaginationOptions {
  isActive?: boolean;
  role?: UserRole;
}

export interface AuthenticatedRequest {
  user: IUserAttributes;
}
