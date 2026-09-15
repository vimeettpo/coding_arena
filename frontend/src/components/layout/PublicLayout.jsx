import { Box, Button, Container, Divider, Stack } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import CollegeLogo from '@/components/common/CollegeLogo';

const PublicLayout = () => {
  const location = useLocation();
  const hideAuthLinks = ['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1.75 }}>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
              <Link to="/">
                <Logo />
              </Link>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center' }} />
                <CollegeLogo height={30} />
              </Box>
            </Stack>
            {!hideAuthLinks && (
              <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
                <Button component={Link} to="/login" color="inherit" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Sign in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Get started
                </Button>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 4, mt: 8, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
              <Logo size="sm" />
              <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
              <CollegeLogo height={26} />
            </Stack>
            <Box sx={{ color: 'text.secondary', fontSize: '0.85rem', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>
              © {new Date().getFullYear()} CodeArena. An initiative by Vishwaniketan.
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicLayout;
