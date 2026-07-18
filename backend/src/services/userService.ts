import { User } from '@/models';
import { IUserAttributes, IUserPaginationOptions, IPaginatedResponse } from '@/types';
import { Op } from 'sequelize';

/**
 * User Service
 */

class UserService {
  /**
   * Create a new user
   */
  async createUser(userData: Omit<IUserAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await User.create(userData);
    return user;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<User | null> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    return user;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    return user;
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    return User.findOne({ where: { username } });
  }

  /**
   * Find all users with pagination
   */
  async findAllUsers(options: IUserPaginationOptions): Promise<IPaginatedResponse<User>> {
    const {
      page = 1,
      limit = 0,
      search,
      isActive,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = options;

    const whereClause: any = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      ...(limit > 0 ? { limit, offset: (page - 1) * limit } : {}),
      order: [[sortBy, sortOrder]],
    });

    const effectiveLimit = limit > 0 ? limit : count || 1;
    const totalPages = limit > 0 ? Math.ceil(count / limit) || 1 : 1;
    const hasNextPage = limit > 0 ? page < totalPages : false;
    const hasPreviousPage = page > 1;

    return {
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count,
        itemsPerPage: effectiveLimit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Find active users with pagination
   */
  async findActiveUsers(options: IUserPaginationOptions): Promise<IPaginatedResponse<User>> {
    return this.findAllUsers({ ...options, isActive: true });
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: Partial<IUserAttributes>): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }
    await user.update(userData);
    return user;
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deactivateUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) {
      return false;
    }
    await user.update({ isActive: false });
    return true;
  }

  /**
   * Delete user permanently
   */
  async deleteUser(id: number): Promise<boolean> {
    const result = await User.destroy({ where: { id } });
    if (result > 0) {
      return true;
    }
    return false;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<void> {
    await User.update(
      { lastLogin: new Date() },
      { where: { id } }
    );
  }

  /**
   * Count total users
   */
  async countUsers(isActive?: boolean): Promise<number> {
    const whereClause: any = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }
    return await User.count({ where: whereClause });
  }
}

export default new UserService();

