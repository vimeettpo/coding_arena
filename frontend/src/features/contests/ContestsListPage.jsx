import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, Stack, Button, Skeleton } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import contestService from '@/services/contestService';

const STATUS_STYLE = {
  LIVE: { label: 'Live Now', color: '#15803D', bgcolor: '#DCFCE7', border: '1px solid #BBF7D0' },
  UPCOMING: { label: 'Upcoming', color: '#0284C7', bgcolor: '#E0F2FE', border: '1px solid #BAE6FD' },
  ENDED: { label: 'Ended', color: '#64748B', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0' },
};

const formatContestTiming = (contest) => {
  if (!contest.startTime) return 'Scheduled';
  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);

  if (now > end || contest.status === 'ENDED') {
    return 'Ended';
  }
  if ((now >= start && now <= end) || contest.status === 'LIVE') {
    return 'Live Now';
  }
  const diffHours = Math.floor((start - now) / 3600000);
  if (diffHours < 24) {
    return `Starts in ${diffHours <= 1 ? 'less than an hour' : `${diffHours} hours`}`;
  }
  const days = Math.floor(diffHours / 24);
  return `Starts in ${days} day${days > 1 ? 's' : ''}`;
};

const ContestsListPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    contestService
      .list()
      .then((res) => setContests(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load contests.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = (id) => {
    contestService
      .register(id)
      .then(() => {
        contestService.list().then((res) => setContests(res.data || []));
      })
      .catch(() => {});
  };

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
          Competitive Arenas & Contests
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Compete live against peer coders in timed rounds, improve your rating, or practice on past problem sets.
        </Typography>
      </Box>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : contests.length > 0 ? (
        <Grid container spacing={2.5}>
          {contests.map((c) => {
            const statusKey = c.status || 'UPCOMING';
            const style = STATUS_STYLE[statusKey] || STATUS_STYLE.UPCOMING;
            return (
              <Grid item xs={12} md={6} key={c.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Box sx={{ pr: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', mb: 0.5 }}>
                        {c.title}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: '#64748B' }}>
                        <ScheduleRoundedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatContestTiming(c)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Chip
                      size="small"
                      label={style.label}
                      sx={{
                        color: style.color,
                        bgcolor: style.bgcolor,
                        border: style.border,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2.5} sx={{ my: 2.5, color: '#64748B' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                      {c.problemCount || 4} problems
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>•</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                      {c.participantCount || 0} participants
                    </Typography>
                  </Stack>

                  <Button
                    fullWidth
                    variant={statusKey === 'LIVE' ? 'contained' : 'outlined'}
                    color="primary"
                    startIcon={<EmojiEventsRoundedIcon />}
                    disabled={statusKey === 'ENDED'}
                    onClick={() => {
                      if (statusKey === 'UPCOMING') {
                        handleRegister(c.id);
                      }
                    }}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1,
                      borderRadius: 2,
                      ...(statusKey === 'LIVE'
                        ? {
                            bgcolor: '#F59E0B',
                            color: '#0F172A',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                            '&:hover': { bgcolor: '#D97706' },
                          }
                        : statusKey === 'UPCOMING'
                        ? {
                            borderColor: '#F59E0B',
                            color: '#D97706',
                            bgcolor: 'rgba(245, 158, 11, 0.04)',
                            '&:hover': {
                              borderColor: '#D97706',
                              bgcolor: 'rgba(245, 158, 11, 0.1)',
                            },
                          }
                        : {
                            borderColor: '#E2E8F0',
                            color: '#94A3B8',
                          }),
                    }}
                  >
                    {statusKey === 'LIVE' ? 'Enter Contest Arena' : statusKey === 'UPCOMING' ? 'Register Now' : 'View Leaderboard'}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
            No contests currently available. Check back soon for the next weekend sprint!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ContestsListPage;
