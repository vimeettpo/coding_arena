import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Avatar, LinearProgress, Skeleton } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import GradeRoundedIcon from '@mui/icons-material/GradeRounded';
import StatCard from '@/components/common/StatCard';
import { baseChartOptions } from '@/theme/chartSetup';
import dashboardService from '@/services/dashboardService';

const SkeletonCard = () => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid', borderColor: 'divider' }}>
    <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={60} height={40} />
    <Skeleton variant="text" width={100} />
  </Paper>
);

const TrainerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardService
      .getTrainerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={260} height={40} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={360} sx={{ mb: 4 }} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <SkeletonCard />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>Trainer dashboard</Typography>
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
      </Box>
    );
  }

  const chartData = {
    labels: (data.eventScores || []).map((e) => e.label || e.eventTitle || 'Event'),
    datasets: [
      {
        label: 'Avg. score',
        data: (data.eventScores || []).map((e) => e.avgScore || 0),
        backgroundColor: '#7C5CFF',
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const pendingSublabel =
    data.pendingSubmissions > 0
      ? `${data.pendingSubmissions} pending grading`
      : 'All graded';

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>Trainer dashboard</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>Your cohorts, contests and assignments at a glance.</Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Students" value={data.studentCount || 0} sublabel="Registered on platform" icon={GroupsRoundedIcon} accent="#0284C7" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Active contests" value={data.activeContestCount || 0} sublabel={data.activeContestSublabel || 'None scheduled'} icon={EmojiEventsRoundedIcon} accent="#7C5CFF" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="My contests" value={data.myContestCount || 0} sublabel={pendingSublabel} icon={AssignmentRoundedIcon} accent="#10B981" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Avg. score" value={data.avgScorePercent > 0 ? `${data.avgScorePercent}%` : '—'} sublabel="Across all contests" icon={GradeRoundedIcon} accent="#F59E0B" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Average score by event</Typography>
            {data.eventScores && data.eventScores.length > 0 ? (
              <Box sx={{ height: 260 }}>
                <Bar data={chartData} options={baseChartOptions} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 6, textAlign: 'center' }}>
                No contest data yet. Create a contest to see scores here.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, overflow: 'auto', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Top performers</Typography>
            {data.topPerformers && data.topPerformers.length > 0 ? (
              <Stack spacing={2}>
                {data.topPerformers.map((p, i) => (
                  <Stack key={`${p.name}-${i}`} direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: i === 0 ? 'rgba(245, 158, 11, 0.15)' : '#F1F5F9', border: '1px solid', borderColor: i === 0 ? '#F59E0B' : 'divider', color: i === 0 ? '#D97706' : 'text.primary', fontSize: '0.8rem', fontWeight: 700 }}>
                      {p.name ? p.name[0] : 'S'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.solved} solved</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'text.primary' }}>{p.score}</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 6, textAlign: 'center' }}>
                No submissions yet.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Contest participation</Typography>
            {data.contestParticipation && data.contestParticipation.length > 0 ? (
              <Stack spacing={2}>
                {data.contestParticipation.map((w) => {
                  const label = w.label || w.eventTitle || 'Contest';
                  const rate = w.participationPercent !== undefined ? w.participationPercent : (w.participationRate !== undefined ? w.participationRate : 0);
                  return (
                    <Box key={label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500} color="text.primary">{label}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{rate}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(rate, 100)}
                        sx={{
                          height: 7,
                          borderRadius: 3,
                          bgcolor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': { bgcolor: '#7C5CFF', borderRadius: 3 }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                No contests created yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainerDashboard;
