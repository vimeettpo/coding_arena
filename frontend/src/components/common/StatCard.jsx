import { Box, Paper, Typography } from '@mui/material';

const StatCard = ({ label, value, sublabel, icon: Icon, accent = '#F59E0B' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      bgcolor: '#FFFFFF',
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
      minWidth: 0,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      '&:hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: 600,
          fontSize: '0.72rem',
        }}
      >
        {label}
      </Typography>
      {Icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${accent}18`,
          }}
        >
          <Icon sx={{ fontSize: 18, color: accent }} />
        </Box>
      )}
    </Box>
    <Typography
      sx={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 800,
        fontSize: '1.9rem',
        lineHeight: 1,
        color: 'text.primary',
      }}
    >
      {value}
    </Typography>
    {sublabel && (
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>
        {sublabel}
      </Typography>
    )}
  </Paper>
);

export default StatCard;
