import { useId } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * CodeArena brand mark: a deep-slate badge carrying a code-chevron motif —
 * the amber caret suggests motion/competition, the pale one completes the
 * tag pair. Wordmark set in Inter for a clean, professional finish.
 * Used in the topbar, dashboards, auth screens and footer.
 */
const Logo = ({ size = 'md', withText = true }) => {
  const px = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;
  const gradientId = useId();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: px,
          height: px,
          borderRadius: `${px * 0.28}px`,
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.28)',
        }}
      >
        <svg width={px} height={px} viewBox="0 0 32 32" role="img" aria-label="CodeArena">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#334155" />
              <stop offset="1" stopColor="#0B1220" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
          <path
            d="M12.4 10.6 7 16l5.4 5.4"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.6 10.6 25 16l-5.4 5.4"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
        </svg>
      </Box>
      {withText && (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: px * 0.62,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: 'text.primary',
          }}
        >
          Code<Box component="span" sx={{ color: '#D97706' }}>Arena</Box>
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
