import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const getInitialState = (): AuthState => {
  try {
    const serializedUser = localStorage.getItem('crm_user');
    if (serializedUser) {
      return {
        user: JSON.parse(serializedUser),
        isAuthenticated: true,
        loading: false,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('crm_user', JSON.stringify(action.payload));
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('crm_user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
});

export const { setCredentials, logoutUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
