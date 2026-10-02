import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title, description, backTo, backLabel }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={handleBack}
        sx={{ mb: 2.5, color: '#64748B', fontWeight: 600, textTransform: 'none' }}
      >
        {backLabel || 'Go back'}
      </Button>

      <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: 'text.primary', fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        {description}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          textAlign: 'center',
          bgcolor: '#FFFFFF',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            color: '#D97706',
            mb: 2,
          }}
        >
          <ConstructionRoundedIcon sx={{ fontSize: 26 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This module is scaffolded and ready for its backend wiring — build it out next.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={handleBack}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {backLabel || 'Return to previous page'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ComingSoon;
