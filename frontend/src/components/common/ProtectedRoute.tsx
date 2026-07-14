import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from 'src/store';
import { refreshUserToken } from 'src/store/slices/authSlice';
import LoadingPage from 'src/pages/Loading';
import { Path } from 'src/constants/enums';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { isAuthenticated, token, loading } = useSelector((state: RootState) => state.auth);
  const [isVerifying, setIsVerifying] = useState(!!token && !isAuthenticated);
  const location = useLocation();
  const dispatch = useDispatch();

  const verifyAuth = useCallback(async () => {
    if (!isAuthenticated && token) {
      try {
        await dispatch(refreshUserToken() as any).unwrap();
      } catch {
        /* handled in slice */
      }
    }
    setIsVerifying(false);
  }, [isAuthenticated, token, dispatch]);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  if (isVerifying || loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to={Path.Login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
