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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useAppDispatch, useAuth } from '@/app/hooks';
import { register, clearAuthError } from '@/features/auth/authSlice';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      navigate('/login', { state: { registered: true, email: form.email } });
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
          Join as a student to compete, or a trainer to run contests and workshops.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

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
              <ToggleButton value="TRAINER">I'm a Trainer</ToggleButton>
            </ToggleButtonGroup>

            <TextField label="Full name" required fullWidth value={form.name} onChange={handleChange('name')} autoComplete="name" />
            <TextField label="Email" type="email" required fullWidth value={form.email} onChange={handleChange('email')} autoComplete="email" />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
              helperText="At least 8 characters, with a number and a symbol."
            />
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
