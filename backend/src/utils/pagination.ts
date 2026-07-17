import { Op } from 'sequelize';
import { IPaginationOptions, IPaginatedResponse } from '@/types';

export function buildPagination<T>(
  rows: T[],
  count: number,
  page: number,
  limit: number
): IPaginatedResponse<T> {
  const totalPages = Math.ceil(count / limit) || 1;
  return {
    data: rows,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: count,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export function parsePagination(query: Record<string, unknown>): IPaginationOptions {
  return {
    page: Math.max(1, parseInt(String(query.page || '1'), 10)),
    limit: Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10))),
    search: query.search ? String(query.search) : undefined,
    sortBy: query.sortBy ? String(query.sortBy) : 'createdAt',
    sortOrder: query.sortOrder === 'ASC' ? 'ASC' : 'DESC',
  };
}

export function searchCondition(fields: string[], search?: string) {
  if (!search) return {};
  return {
    [Op.or]: fields.map((field) => ({ [field]: { [Op.iLike]: `%${search}%` } })),
  };
}

export function toPublicUser(user: {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}
