import { Op } from 'sequelize';
import { IPaginationOptions, IPaginatedResponse } from '@/types';

export function buildPagination<T>(
  rows: T[],
  count: number,
  page: number,
  limit: number
): IPaginatedResponse<T> {
  const effectiveLimit = limit > 0 ? limit : count || 1;
  const totalPages = limit > 0 ? Math.ceil(count / limit) || 1 : 1;
  return {
    data: rows,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount: count,
      itemsPerPage: effectiveLimit,
      hasNextPage: limit > 0 ? page < totalPages : false,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Parse list query params.
 * - limit omitted / 0 / "all" → no row cap (return all matching rows)
 * - otherwise use the requested limit as-is (no max ceiling)
 */
export function parsePagination(query: Record<string, unknown>): IPaginationOptions {
  const raw = query.limit;
  let limit = 0;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '' && String(raw).toLowerCase() !== 'all') {
    const n = parseInt(String(raw), 10);
    if (!Number.isNaN(n) && n > 0) limit = n;
  }

  return {
    page: Math.max(1, parseInt(String(query.page || '1'), 10) || 1),
    limit,
    search: query.search ? String(query.search) : undefined,
    sortBy: query.sortBy ? String(query.sortBy) : 'id',
    sortOrder: query.sortOrder === 'DESC' ? 'DESC' : 'ASC',
  };
}

/** Sequelize limit/offset only when a positive limit is set. */
export function pageWindow(page: number, limit: number): { limit?: number; offset?: number } {
  if (limit <= 0) return {};
  return { limit, offset: (page - 1) * limit };
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
