import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  systemName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
}

const initialState: SettingsState = {
  systemName: 'Antigravity CRM',
  companyName: '',
  contactEmail: '',
  contactPhone: ''
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    }
  },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
