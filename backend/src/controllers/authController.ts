import { Request, Response } from 'express';
import authService from '@/services/authService';
import logger from '@/utils/logger';
import { generateToken } from '@/utils/jwt';
import { toPublicUser } from '@/utils/pagination';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    logger.info(`User registered: ${req.body.email}`);
    return res.status(201).json({ success: true, message: '登録が完了しました', data: result });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    logger.info(`User logged in: ${req.body.email}`);
    return res.status(200).json({ success: true, message: 'ログインしました', data: result });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.status(200).json({
      success: true,
      message: 'トークンを更新しました',
      data: { user: toPublicUser(user), token },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(user.id, oldPassword, newPassword);
    return res.status(200).json({ success: true, message: 'パスワードを変更しました' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
