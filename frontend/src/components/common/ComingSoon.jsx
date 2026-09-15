import { Box, Typography, Paper } from '@mui/material';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';

const ComingSoon = ({ title, description }) => (
  <Box>
    <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: 'text.primary', fontWeight: 700 }}>{title}</Typography>
    <Typography sx={{ color: 'text.secondary', mb: 3 }}>{description}</Typography>
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
      <Typography variant="body2" color="text.secondary">
        This module is scaffolded and ready for its backend wiring — build it out next.
      </Typography>
    </Paper>
  </Box>
);

export default ComingSoon;
