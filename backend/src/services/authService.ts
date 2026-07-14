import bcrypt from 'bcrypt';
import { User } from '@/models';
import CustomError from '@/utils/customError';
import { generateToken } from '@/utils/jwt';
import { ILoginRequest, IRegisterRequest, IAuthResponse } from '@/types';
import { toPublicUser } from '@/utils/pagination';
import userService from '@/services/userService';

class AuthService {
  async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
    const existingUser = await userService.findUserByEmail(registerData.email);
    if (existingUser) {
      throw new CustomError('このメールアドレスは既に登録されています', 409);
    }

    const existingUsername = await User.findOne({ where: { username: registerData.username } });
    if (existingUsername) {
      throw new CustomError('このユーザー名は既に使用されています', 409);
    }

    const hashedPassword = await bcrypt.hash(registerData.password, 10);
    const user = await User.create({
      email: registerData.email,
      username: registerData.username,
      password: hashedPassword,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      role: registerData.role || 'sales',
      isActive: true,
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user) as IAuthResponse['user'], token };
  }

  async login(loginData: ILoginRequest): Promise<IAuthResponse> {
    const user = await userService.findUserByEmail(loginData.email);
    if (!user) {
      throw new CustomError('メールアドレスまたはパスワードが正しくありません', 401);
    }
    if (!user.isActive) {
      throw new CustomError('アカウントが無効化されています', 403);
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new CustomError('メールアドレスまたはパスワードが正しくありません', 401);
    }

    await userService.updateLastLogin(user.id);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user) as IAuthResponse['user'], token };
  }

  async verifyUserStatus(userId: number): Promise<User> {
    const user = await userService.findUserById(userId);
    if (!user) throw new CustomError('ユーザーが見つかりません', 404);
    if (!user.isActive) throw new CustomError('アカウントが無効化されています', 403);
    return user;
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new CustomError('ユーザーが見つかりません', 404);

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) throw new CustomError('現在のパスワードが正しくありません', 401);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
  }
}

export default new AuthService();
