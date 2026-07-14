import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { TOKEN_KEY } from 'src/constants/config';
import type { IAuthState, ILoginCredentials, IUser } from 'src/types/index';

const initialState: IAuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: ILoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post(endpoints.auth.login, credentials);
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'ログインに失敗しました');
    }
  }
);

export const refreshUserToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.auth.refresh);
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'セッションの確認に失敗しました');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { getState, dispatch }) => {
    const state = getState() as { auth: IAuthState };
    if (state.auth.token) {
      try {
        return await dispatch(refreshUserToken()).unwrap();
      } catch {
        dispatch(logout());
        return null;
      }
    }
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem(TOKEN_KEY);
    },
    updateUserData: (state, action: PayloadAction<IUser>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
      })
      .addCase(refreshUserToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem(TOKEN_KEY);
      });
  },
});

export const { logout, updateUserData } = authSlice.actions;
export default authSlice.reducer;
