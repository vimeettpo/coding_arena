import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Link,
  IconButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
} from '@mui/material';
import Visibility from '@mui/icons-material/VisibilityRounded';
import VisibilityOff from '@mui/icons-material/VisibilityOffRounded';
import { useAppDispatch, useAuth } from '@/app/hooks';
import { register, clearAuthError } from '@/features/auth/authSlice';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', collegeId: '', branch: '', year: '', adminSecretCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setLocalError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (form.role === 'STUDENT' && (!form.collegeId.trim() || !form.branch.trim() || !form.year)) {
      setLocalError('Please fill in your College ID, Branch, and Year.');
      return;
    }

    if (form.role === 'ADMIN' && !form.adminSecretCode.trim()) {
      setLocalError('Please enter the Admin Secret Code.');
      return;
    }

    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    const result = await dispatch(
      register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === 'STUDENT' && {
          collegeId: form.collegeId.trim(),
          branch: form.branch.trim(),
          year: form.year,
        }),
        ...(form.role === 'ADMIN' && {
          adminSecretCode: form.adminSecretCode.trim(),
        }),
      })
    );

    if (register.fulfilled.match(result)) {
      navigate('/login', { state: { registered: true, email: form.email.trim() } });
    }
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
        <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>Create your account</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Join as a student to compete or an admin to manage the platform.
        </Typography>

        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {localError || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={form.role}
              onChange={(_, value) => value && setForm((prev) => ({ ...prev, role: value }))}
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
                },
              }}
            >
              <ToggleButton value="STUDENT">I'm a Student</ToggleButton>
              <ToggleButton value="ADMIN">I'm an Admin</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Full name"
              required
              fullWidth
              value={form.name}
              onChange={handleChange('name')}
              autoComplete="name"
            />
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
              helperText="At least 8 characters."
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

            {/* Student-only fields */}
            {form.role === 'STUDENT' && (
              <>
                <TextField
                  label="College ID"
                  required
                  fullWidth
                  value={form.collegeId}
                  onChange={handleChange('collegeId')}
                  placeholder="e.g. 22CS1001"
                />
                <TextField
                  label="Branch"
                  required
                  fullWidth
                  select
                  value={form.branch}
                  onChange={handleChange('branch')}
                >
                  {['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'CSD', 'Other'].map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Year"
                  required
                  fullWidth
                  select
                  value={form.year}
                  onChange={handleChange('year')}
                >
                  {[1, 2, 3, 4].map((y) => (
                    <MenuItem key={y} value={y}>Year {y}</MenuItem>
                  ))}
                </TextField>
              </>
            )}

            {/* Admin-only fields */}
            {form.role === 'ADMIN' && (
              <TextField
                label="Admin Secret Code"
                type="password"
                required
                fullWidth
                value={form.adminSecretCode}
                onChange={handleChange('adminSecretCode')}
                placeholder="Enter the admin secret code"
                helperText="Contact the system owner to obtain the admin secret code."
              />
            )}
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
              {status === 'loading' ? 'Creating account…' : 'Create account'}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ color: '#D97706', fontWeight: 600 }}>Sign in</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
