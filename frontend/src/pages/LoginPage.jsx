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
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>Sign in</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
          Enter any credentials to sign in directly.
        </Typography>

        {location.state?.registered && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Account created successfully! Please sign in.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.8, display: 'block' }}>
                Sign in as:
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={form.role}
                onChange={handleRoleChange}
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    py: 0.8,
                    fontWeight: 500,
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
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="Any password"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
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
                control={<Checkbox size="small" checked={form.rememberMe} onChange={handleChange('rememberMe')} />}
                label={<Typography variant="body2">Remember me</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Stack>
            <Button type="submit" variant="contained" size="large" disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>or continue with</Typography>
        </Divider>

        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
            sx={{ borderColor: 'divider' }}
          >
            Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<GitHubIcon />}
            onClick={() => handleSocialLogin('github')}
            sx={{ borderColor: 'divider' }}
          >
            GitHub
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          New to CodeArena?{' '}
          <Link component={RouterLink} to="/register">Create an account</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginPage;
