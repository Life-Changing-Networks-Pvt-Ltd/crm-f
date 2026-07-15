import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
  sidebarCollapsed: boolean;
}

const initialState: LayoutState = {
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', String(action.payload));
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed } = layoutSlice.actions;
export default layoutSlice.reducer;
