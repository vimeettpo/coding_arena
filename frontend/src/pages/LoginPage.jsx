import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import Visibility from '@mui/icons-material/VisibilityRounded';
import VisibilityOff from '@mui/icons-material/VisibilityOffRounded';
import { useAppDispatch, useAuth } from '@/app/hooks';
import { login, clearAuthError } from '@/features/auth/authSlice';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (e) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'email' && typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower.includes('admin')) next.role = 'ADMIN';
        else if (lower.includes('trainer')) next.role = 'TRAINER';
      }
      return next;
    });
  };

  const handleRoleChange = (_, newRole) => {
    if (newRole) {
      setForm((prev) => ({ ...prev, role: newRole }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    dispatch(clearAuthError());

    const chosenRole = form.role || 'STUDENT';
    const effectiveEmail = form.email.trim() || (
      chosenRole === 'ADMIN' ? 'admin@codearena.local' : chosenRole === 'TRAINER' ? 'trainer@codearena.local' : 'student@codearena.local'
    );
    const effectivePassword = form.password || 'password';

    const result = await dispatch(
      login({
        email: effectiveEmail,
        password: effectivePassword,
        role: chosenRole,
      })
    );

    const userRole = result.payload?.role || chosenRole;
    const fallbackDest = userRole === 'ADMIN' ? '/admin' : userRole === 'TRAINER' ? '/trainer' : '/student';
    const dest = location.state?.from?.pathname || fallbackDest;
    navigate(dest, { replace: true });
  };

  const handleSocialLogin = (provider) => {
    const chosenRole = form.role || 'STUDENT';
    dispatch(
      login({
        email: `${provider.toLowerCase()}@codearena.local`,
        password: 'social-login',
        role: chosenRole,
      })
    ).then((result) => {
      const userRole = result.payload?.role || chosenRole;
      const fallbackDest = userRole === 'ADMIN' ? '/admin' : userRole === 'TRAINER' ? '/trainer' : '/student';
      navigate(fallbackDest, { replace: true });
    });
  };

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 8, md: 12 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          bgcolor: '#FFFFFF',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>Sign in</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
          Enter your credentials to access your workspace.
        </Typography>

        {location.state?.registered && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            Account created successfully! Please sign in.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.8, display: 'block', fontWeight: 600 }}>
                Sign in as:
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={form.role}
                onChange={handleRoleChange}
                sx={{
                  bgcolor: '#F1F5F9',
                  p: 0.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    py: 0.75,
                    fontWeight: 600,
                    borderRadius: 2,
                    border: 'none',
                    color: 'text.secondary',
                    transition: 'all 0.15s ease',
                    '&.Mui-selected': {
                      bgcolor: '#FFFFFF',
                      color: '#D97706',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      fontWeight: 700,
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.6)',
                    },
                  },
                }}
              >
                <ToggleButton value="STUDENT">Student</ToggleButton>
                <ToggleButton value="TRAINER">Trainer</ToggleButton>
                <ToggleButton value="ADMIN">Admin</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              label="Email or Username"
              type="text"
              fullWidth
              placeholder="e.g. admin, student, or any text"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="username"
              InputLabelProps={{ sx: { color: 'text.secondary' } }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="Any password"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
              InputLabelProps={{ sx: { color: 'text.secondary' } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label="Toggle password visibility">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <FormControlLabel
                control={<Checkbox size="small" checked={form.rememberMe} onChange={handleChange('rememberMe')} sx={{ color: 'text.secondary' }} />}
                label={<Typography variant="body2" sx={{ color: 'text.primary' }}>Remember me</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: '#D97706', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </Stack>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={status === 'loading'}
              sx={{
                fontWeight: 700,
                py: 1.25,
                bgcolor: '#F59E0B',
                color: '#0F172A',
                '&:hover': { bgcolor: '#E58E00' },
              }}
            >
              {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>or continue with</Typography>
        </Divider>

        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
            sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 600, py: 1 }}
          >
            Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<GitHubIcon />}
            onClick={() => handleSocialLogin('github')}
            sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 600, py: 1 }}
          >
            GitHub
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          New to CodeArena?{' '}
          <Link component={RouterLink} to="/register" sx={{ color: '#D97706', fontWeight: 600 }}>Create an account</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginPage;
