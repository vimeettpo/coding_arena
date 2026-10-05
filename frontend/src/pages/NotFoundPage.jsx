import { Container, Typography, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <Container maxWidth="sm" sx={{ py: 14, textAlign: 'center' }}>
    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '4.5rem', fontWeight: 800, color: '#D97706', mb: 1 }}>
      404
    </Typography>
    <Typography variant="h5" sx={{ mb: 1, color: '#0F172A', fontWeight: 700 }}>This route didn't compile.</Typography>
    <Typography sx={{ color: 'text.secondary', mb: 4 }}>
      The page you're looking for doesn't exist, or you don't have access to it.
    </Typography>
    <Stack direction="row" spacing={2} justifyContent="center">
      <Button component={Link} to="/" variant="contained" sx={{ px: 3, py: 1, fontWeight: 700 }}>Back to home</Button>
    </Stack>
  </Container>
);

export default NotFoundPage;
