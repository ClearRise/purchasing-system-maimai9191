import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { loginUser } from 'src/store/slices/authSlice';
import { useAuth } from 'src/hooks/usePermissions';
import { COMPANY_NAME, SYSTEM_NAME, LOGO_LARGE_URL } from 'src/constants/config';
import { Path } from 'src/constants/enums';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ email, password }) as any).unwrap();
      navigate(Path.Dashboard);
    } catch {
      /* error in state */
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
        boxSizing: 'border-box',
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 440,
          px: { xs: 3, sm: 4 },
          py: { xs: 3.5, sm: 4 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'primary.main',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            }}
          >
            {COMPANY_NAME}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              mt: 1,
              fontWeight: 400,
              fontSize: { xs: '1.0625rem', sm: '1.125rem' },
            }}
          >
            {SYSTEM_NAME}
          </Typography>
        </Box>

        <Box
          component="img"
          src={LOGO_LARGE_URL}
          alt={COMPANY_NAME}
          sx={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            mb: 3.5,
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                      >
                          {showPassword
                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                            : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ mt: 0.5, py: 1.5 }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;
