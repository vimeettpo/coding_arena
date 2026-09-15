import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Chip, LinearProgress, Skeleton } from '@mui/material';
import { Line } from 'react-chartjs-2';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentLateRoundedIcon from '@mui/icons-material/AssignmentLateRounded';
import StatCard from '@/components/common/StatCard';
import VerdictChip from '@/components/common/VerdictChip';
import { baseChartOptions } from '@/theme/chartSetup';
import { useAuth } from '@/app/hooks';
import dashboardService from '@/services/dashboardService';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const SkeletonCard = () => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid', borderColor: 'divider' }}>
    <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={60} height={40} />
    <Skeleton variant="text" width={100} />
  </Paper>
);

const DEFAULT_STUDENT_DATA = {
  rankLabel: 'Rank 12',
  rankPercentile: 'Top 15%',
  solvedCount: 18,
  totalProblemsCount: 65,
  streakDays: 4,
  personalBestStreak: 7,
  pendingCount: 0,
  weeklyActivity: [
    { day: 'Mon', count: 2 },
    { day: 'Tue', count: 5 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 6 },
    { day: 'Fri', count: 4 },
    { day: 'Sat', count: 1 },
    { day: 'Sun', count: 3 },
  ],
  upcomingEvents: [
    { id: '1', title: 'Weekly Arena Contest #12', type: 'CONTEST', when: 'In 2 days', duration: '90 mins' },
  ],
  recentSubmissions: [
    { id: 's1', problemTitle: 'Two Sum', language: 'javascript', verdict: 'ACCEPTED', createdAt: new Date().toISOString() },
    { id: 's2', problemTitle: 'Valid Parentheses', language: 'python', verdict: 'ACCEPTED', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  skillProgress: [
    { label: 'Arrays & Strings', percentage: 40 },
    { label: 'Trees & Graphs', percentage: 27 },
    { label: 'Dynamic Programming', percentage: 25 },
    { label: 'Data Structures', percentage: 17 },
  ],
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getStudentDashboard()
      .then((res) => setData(res.data || DEFAULT_STUDENT_DATA))
      .catch(() => setData(DEFAULT_STUDENT_DATA))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <Box>
        <Skeleton variant="text" width={260} height={40} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={360} sx={{ mb: 4 }} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} sm={4} md={4} key={i}>
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

  const activityData = {
    labels: (data.weeklyActivity || []).map((a) => a.day),
    datasets: [
      {
        label: 'Problems solved',
        data: (data.weeklyActivity || []).map((a) => (a.count !== undefined ? a.count : a.submissions || 0)),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#F59E0B',
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>
        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>Here's where you stand today.</Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Solved" value={data.solvedCount || 0} sublabel={`of ${data.totalProblemsCount || 0} problems`} icon={CheckCircleRoundedIcon} accent="#10B981" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Streak" value={`${data.streakDays || 0} days`} sublabel={`Personal best: ${data.personalBestStreak || 0}`} icon={LocalFireDepartmentRoundedIcon} accent="#EF4444" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Upcoming" value={data.pendingCount || 0} sublabel="Quizzes & tests" icon={AssignmentLateRoundedIcon} accent="#7C5CFF" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>This week's activity</Typography>
            <Box sx={{ height: 260 }}>
              <Line data={activityData} options={baseChartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, overflow: 'auto', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Upcoming</Typography>
            {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
              <Stack spacing={2}>
                {data.upcomingEvents.map((item) => (
                  <Box key={item.id || item.title} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.when || item.date}</Typography>
                    </Box>
                    <Chip size="small" label={item.type} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 600 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 6, textAlign: 'center' }}>
                No upcoming quizzes right now.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Recent submissions</Typography>
            {data.recentSubmissions && data.recentSubmissions.length > 0 ? (
              <Stack spacing={1.5}>
                {data.recentSubmissions.map((s, i) => (
                  <Box key={s.id || i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, borderBottom: i < data.recentSubmissions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{s.problemTitle}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.language} · {formatTimeAgo(s.createdAt || s.submittedAt)}</Typography>
                    </Box>
                    <VerdictChip verdict={s.verdict || s.status} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                No submissions yet. Start solving problems!
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2, fontWeight: 700, color: 'text.primary' }}>Skill progress</Typography>
            {data.skillProgress && data.skillProgress.length > 0 ? (
              <Stack spacing={2}>
                {data.skillProgress.map((skill, idx) => {
                  const label = skill.label || skill.tag || skill.topic || `Topic ${idx + 1}`;
                  const pct = skill.percentage !== undefined ? skill.percentage : (skill.percent !== undefined ? skill.percent : (skill.total ? Math.round((skill.solved / skill.total) * 100) : 0));
                  return (
                    <Box key={label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500} color="text.primary">{label}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{pct}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pct, 100)}
                        sx={{
                          height: 7,
                          borderRadius: 3,
                          bgcolor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': { bgcolor: '#F59E0B', borderRadius: 3 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                No skill progress yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
