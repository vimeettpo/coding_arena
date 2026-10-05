import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import authService from '@/services/authService';

const readStoredUser = () => {
  const token = localStorage.getItem('ca_access_token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('ca_access_token');
      localStorage.removeItem('ca_refresh_token');
      return null;
    }
    return {
      id: decoded.sub || '00000000-0000-0000-0000-000000000000',
      email: decoded.email || '',
      role: decoded.role || 'STUDENT',
      name: decoded.name || 'Arena User',
    };
  } catch {
    localStorage.removeItem('ca_access_token');
    localStorage.removeItem('ca_refresh_token');
    return null;
  }
};

const initialState = {
  user: readStoredUser(),
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

export const login = createAsyncThunk('auth/login', async (credentials = {}, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    const { accessToken, refreshToken, user } = response.data;
    localStorage.setItem('ca_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('ca_refresh_token', refreshToken);
    }
    const decoded = jwtDecode(accessToken);
    return {
      id: user?.id || decoded.sub,
      email: user?.email || decoded.email || credentials.email,
      role: user?.role || decoded.role || 'STUDENT',
      name: user?.name || decoded.name || 'Arena User',
    };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Invalid email or password.';
    return rejectWithValue(message);
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.register(payload);
    return response.data || response;
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Registration failed.';
    return rejectWithValue(message);
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('ca_access_token');
  if (!token) return null;
  try {
    const response = await authService.me();
    return response.data;
  } catch (err) {
    localStorage.removeItem('ca_access_token');
    localStorage.removeItem('ca_refresh_token');
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  try {
    await authService.logout();
  } catch (_e) {
    // Ignore server error on logout
  }
  dispatch(authSlice.actions.logout());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('ca_access_token');
      localStorage.removeItem('ca_refresh_token');
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = {
            id: action.payload.id,
            email: action.payload.email,
            role: action.payload.role,
            name: action.payload.name,
          };
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
