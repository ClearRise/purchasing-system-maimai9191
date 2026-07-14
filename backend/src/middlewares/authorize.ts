import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/config/constants';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: '権限がありません' });
    }
    next();
  };
};

export const adminOnly = authorize('admin');
export const purchaseAccess = authorize('admin', 'purchase');
export const salesAccess = authorize('admin', 'sales');
export const readOnlySales = authorize('admin', 'purchase', 'sales');
