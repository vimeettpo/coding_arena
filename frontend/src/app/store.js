import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import editorReducer from '@/features/editor/editorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    editor: editorReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
