import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  grants?: string[];
  scopes?: Record<string, string>;
  teamIds?: string[];
  roleId?: string | null;
  accessVersion?: number;
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const getInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem('crm_token');
    const serializedUser = localStorage.getItem('crm_user');
    if (serializedUser) {
      const user = JSON.parse(serializedUser);
      return {
        user,
        token: token || user.token || null,
        isAuthenticated: true,
        loading: false,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User & { token?: string }>) => {
      state.user = action.payload;
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem('crm_token', action.payload.token);
      }
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('crm_user', JSON.stringify(action.payload));
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_token');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
});

export const { setCredentials, logoutUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
