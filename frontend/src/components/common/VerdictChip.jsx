import { Chip } from '@mui/material';

// Maps every possible judge verdict to a color so it's instantly scannable
// in tables, submission feeds and the run console.
const VERDICT_STYLES = {
  ACCEPTED: { label: 'Accepted', color: '#059669', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.3)' },
  WRONG_ANSWER: { label: 'Wrong Answer', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.3)' },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', color: '#D97706', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.3)' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', color: '#D97706', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.3)' },
  RUNTIME_ERROR: { label: 'Runtime Error', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.3)' },
  COMPILATION_ERROR: { label: 'Compilation Error', color: '#B91C1C', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.3)' },
  PRESENTATION_ERROR: { label: 'Presentation Error', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.10)', border: 'rgba(2, 132, 199, 0.3)' },
  PENDING: { label: 'Judging…', color: '#64748B', bg: 'rgba(100, 116, 139, 0.10)', border: 'rgba(100, 116, 139, 0.3)' },
};

const VerdictChip = ({ verdict, size = 'small' }) => {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.PENDING;
  return (
    <Chip
      size={size}
      label={style.label}
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.72rem',
      }}
    />
  );
};

export default VerdictChip;
