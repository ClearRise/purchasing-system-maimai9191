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
   * Find all users with pagination
   */
  async findAllUsers(options: IUserPaginationOptions): Promise<IPaginatedResponse<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Filter by active status if provided
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Search by email, firstName, or lastName
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Fetch users with pagination
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count,
        itemsPerPage: limit,
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

