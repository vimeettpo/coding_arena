import { Box, Stack, Typography } from '@mui/material';
import collegeLogo from '@/assets/vishwaniketan-logo.png';

/**
 * Vishwaniketan college lockup. Used in the public header, landing hero
 * and footer to brand the platform as a Vishwaniketan initiative.
 */
const CollegeLogo = ({ height = 34, withTagline = false }) => (
  <Stack direction="row" alignItems="center" spacing={1.5}>
    <Box
      component="img"
      src={collegeLogo}
      alt="Vishwaniketan"
      sx={{ height, width: 'auto', display: 'block', flexShrink: 0 }}
    />
    {withTagline && (
      <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 1.5 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary' }}>
          NURTURE · INSPIRE · TRANSFORM
        </Typography>
      </Box>
    )}
  </Stack>
);

export default CollegeLogo;
