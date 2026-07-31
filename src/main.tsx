import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { store, type RootState } from './store';
import { router } from './routes/router';
import { queryClient } from './lib/queryClient';
import { crmQueryKeys, fetchCurrentUser } from './lib/crmQueries';
import { settingsQueryOptions } from './hooks/useCrmReferenceData';
import { clearPersistedQueryCache } from './lib/queryClient';
import './index.css';
import { Toaster } from '@/components/ui/sonner';

import { ThemeProvider } from '@/components/ThemeProvider';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logoutUser } from './store/slices/authSlice';
import { setSettings } from './store/slices/settingsSlice';
function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const currentUserQuery = useQuery({
    queryKey: crmQueryKeys.currentUser,
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const settingsQuery = useQuery({
    ...settingsQueryOptions(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (currentUserQuery.data) {
      dispatch(setCredentials(currentUserQuery.data));
    }
  }, [currentUserQuery.data, dispatch]);

  useEffect(() => {
    if (currentUserQuery.isError && isAuthenticated) {
      console.error('Session expired or failed to fetch user:', currentUserQuery.error);
      clearPersistedQueryCache();
      dispatch(logoutUser());
    }
  }, [currentUserQuery.error, currentUserQuery.isError, dispatch, isAuthenticated]);

  useEffect(() => {
    if (settingsQuery.data) {
      dispatch(setSettings(settingsQuery.data));
    }
  }, [dispatch, settingsQuery.data]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="crm-theme">
      <RouterProvider router={router} context={{ auth: { isAuthenticated, user } }} />
      <Toaster />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
