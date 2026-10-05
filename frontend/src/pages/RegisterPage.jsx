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

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    collegeId: '',
    branch: '',
    year: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    if (localError) {
      setLocalError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(clearAuthError());
    setLocalError('');

    // Required basic fields
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    // Required student fields
    if (
      !form.collegeId.trim() ||
      !form.branch.trim() ||
      !form.year
    ) {
      setLocalError(
        'Please fill in your College ID, Branch, and Year.'
      );
      return;
    }

    // Password validation
    if (form.password.length < 8) {
      setLocalError(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    const result = await dispatch(
      register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'STUDENT',
        collegeId: form.collegeId.trim(),
        branch: form.branch.trim(),
        year: form.year,
      })
    );

    if (register.fulfilled.match(result)) {
      navigate('/login', {
        state: {
          registered: true,
          email: form.email.trim(),
        },
      });
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
          boxShadow:
            '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: '1.5rem',
            mb: 0.5,
            color: '#0F172A',
            fontWeight: 800,
          }}
        >
          Create your account
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 3,
          }}
        >
          Create your student account to access CodeArena.
        </Typography>

        {(error || localError) && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {localError || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>

            {/* Full Name */}
            <TextField
              label="Full name"
              required
              fullWidth
              value={form.name}
              onChange={handleChange('name')}
              autoComplete="name"
            />

            {/* Email */}
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
            />

            {/* Password */}
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
                    <IconButton
                      onClick={() =>
                        setShowPassword((s) => !s)
                      }
                      edge="end"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* College ID */}
            <TextField
              label="College ID"
              required
              fullWidth
              value={form.collegeId}
              onChange={handleChange('collegeId')}
              placeholder="e.g. 22CS1001"
            />

            {/* Branch */}
            <TextField
              label="Branch"
              required
              fullWidth
              select
              value={form.branch}
              onChange={handleChange('branch')}
            >
              {[
                'CSE',
                'ECE',
                'EEE',
                'ME',
                'CE',
                'IT',
                'AIDS',
                'AIML',
                'CSD',
                'Other',
              ].map((branch) => (
                <MenuItem key={branch} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </TextField>

            {/* Year */}
            <TextField
              label="Year"
              required
              fullWidth
              select
              value={form.year}
              onChange={handleChange('year')}
            >
              {[1, 2, 3, 4].map((year) => (
                <MenuItem key={year} value={year}>
                  Year {year}
                </MenuItem>
              ))}
            </TextField>

            {/* Create Account Button */}
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
                '&:hover': {
                  bgcolor: '#E58E00',
                },
              }}
            >
              {status === 'loading'
                ? 'Creating account…'
                : 'Create account'}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 3,
            color: 'text.secondary',
          }}
        >
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: '#D97706',
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default RegisterPage;