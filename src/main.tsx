import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { RouterProvider } from '@tanstack/react-router';
import { store, type RootState } from './store';
import { router } from './routes/router';
import './index.css';
import { Toaster } from '@/components/ui/sonner';

import { ThemeProvider } from '@/components/ThemeProvider';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logoutUser } from './store/slices/authSlice';
import { setSettings } from './store/slices/settingsSlice';
import api from './services/api';

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.data) {
          dispatch(setCredentials(res.data.data));
        }
      } catch (error) {
        console.error('Session expired or failed to fetch user:', error);
        // We only logout if there was a token but it's invalid, 
        // but it's safer to just clear if me fails and we thought we were auth'd
        if (isAuthenticated) {
          dispatch(logoutUser());
        }
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.data) {
          dispatch(setSettings(res.data.data));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    if (isAuthenticated) {
      fetchUser();
      fetchSettings();
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="crm-theme">
      <RouterProvider router={router} context={{ auth: { isAuthenticated } }} />
      <Toaster />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
