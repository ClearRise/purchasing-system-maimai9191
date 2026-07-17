import { Request, Response } from 'express';
import userService from '@/services/userService';
import logger from '@/utils/logger';
import CustomError from '@/utils/customError';
import bcrypt from 'bcrypt';
import { IUserPaginationOptions } from '@/types';

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    const existingEmail = await userService.findUserByEmail(userData.email);
    if (existingEmail) {
      throw new CustomError('このメールアドレスは既に登録されています', 400);
    }

    const existingUsername = await userService.findUserByUsername(userData.username);
    if (existingUsername) {
      throw new CustomError('このユーザー名は既に使用されています', 400);
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = await userService.createUser(userData);

    const userResponse = user.toJSON();
    delete (userResponse as any).password;

    return res.status(201).json({
      success: true,
      message: 'ユーザーを登録しました',
      data: userResponse,
    });
  } catch (error: any) {
    logger.error('Error creating user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query as unknown as IUserPaginationOptions;

    // Validate pagination parameters
    if (page < 1) {
      throw new CustomError('Page number must be greater than 0', 400);
    }
    if (limit < 1 || limit > 100) {
      throw new CustomError('Limit must be between 1 and 100', 400);
    }

    const result = await userService.findAllUsers({
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Error fetching users:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id), 10);

    const user = await userService.findUserById(userId);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error: any) {
    logger.error('Error fetching user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    const actorId = (req as any).user?.id as number | undefined;
    const userData = { ...req.body };

    const current = await userService.findUserById(userId);
    if (!current) {
      throw new CustomError('ユーザーが見つかりません', 404);
    }

    if (userData.isActive === false && actorId === userId) {
      throw new CustomError('自分自身のアカウントは無効化できません', 400);
    }

    if (userData.email && userData.email !== current.email) {
      const existingEmail = await userService.findUserByEmail(userData.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new CustomError('このメールアドレスは既に登録されています', 400);
      }
    }

    if (userData.username && userData.username !== current.username) {
      const existingUsername = await userService.findUserByUsername(userData.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new CustomError('このユーザー名は既に使用されています', 400);
      }
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    } else {
      delete userData.password;
    }

    const user = await userService.updateUser(userId, userData);
    if (!user) {
      throw new CustomError('ユーザーが見つかりません', 404);
    }

    const userResponse = user.toJSON();
    delete (userResponse as any).password;

    return res.status(200).json({
      success: true,
      message: 'ユーザーを更新しました',
      data: userResponse,
    });
  } catch (error: any) {
    logger.error('Error updating user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id), 10);

    const success = await userService.deactivateUser(userId);

    if (!success) {
      throw new CustomError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error: any) {
    logger.error('Error deactivating user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete user permanently
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    const actorId = (req as any).user?.id as number | undefined;

    if (actorId && actorId === userId) {
      throw new CustomError('自分自身のアカウントは削除できません', 400);
    }

    const success = await userService.deleteUser(userId);

    if (!success) {
      throw new CustomError('ユーザーが見つかりません', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'ユーザーを削除しました',
    });
  } catch (error: any) {
    logger.error('Error deleting user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await userService.countUsers();
    const activeUsers = await userService.countUsers(true);
    const inactiveUsers = await userService.countUsers(false);

    return res.status(200).json({
      success: true,
      message: 'User statistics fetched successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching user stats:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};