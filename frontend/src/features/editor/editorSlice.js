import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'ca_editor_prefs';

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  language: 'java',
  monacoTheme: 'ca-light',
  fontSize: 14,
  autoSave: true,
  splitScreen: true,
  ...loadPrefs(),
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setLanguage(state, action) {
      state.language = action.payload;
    },
    toggleTheme(state) {
      state.monacoTheme = state.monacoTheme === 'ca-dark' ? 'ca-light' : 'ca-dark';
    },
    setFontSize(state, action) {
      state.fontSize = action.payload;
    },
    toggleAutoSave(state) {
      state.autoSave = !state.autoSave;
    },
    toggleSplitScreen(state) {
      state.splitScreen = !state.splitScreen;
    },
    persistPrefs(state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
  },
});

export const {
  setLanguage,
  toggleTheme,
  setFontSize,
  toggleAutoSave,
  toggleSplitScreen,
  persistPrefs,
} = editorSlice.actions;
export default editorSlice.reducer;
