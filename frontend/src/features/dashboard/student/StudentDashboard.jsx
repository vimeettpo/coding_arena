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
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
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
    { day: 'Mon', submissions: 2 },
    { day: 'Tue', submissions: 5 },
    { day: 'Wed', submissions: 3 },
    { day: 'Thu', submissions: 6 },
    { day: 'Fri', submissions: 4 },
    { day: 'Sat', submissions: 1 },
    { day: 'Sun', submissions: 3 },
  ],
  upcomingEvents: [
    { id: '1', title: 'Weekly Arena Contest #12', type: 'CONTEST', date: 'In 2 days', duration: '90 mins' },
  ],
  recentSubmissions: [
    { id: 's1', problemTitle: 'Two Sum', language: 'javascript', status: 'ACCEPTED', submittedAt: new Date().toISOString() },
    { id: 's2', problemTitle: 'Valid Parentheses', language: 'python', status: 'ACCEPTED', submittedAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  skillProgress: [
    { topic: 'Arrays & Strings', solved: 8, total: 20 },
    { topic: 'Trees & Graphs', solved: 4, total: 15 },
    { topic: 'Dynamic Programming', solved: 3, total: 12 },
    { topic: 'Data Structures', solved: 3, total: 18 },
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
    labels: data.weeklyActivity.map((a) => a.day),
    datasets: [
      {
        label: 'Problems solved',
        data: data.weeklyActivity.map((a) => a.count),
        borderColor: '#FFB020',
        backgroundColor: 'rgba(255,176,32,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5 }}>
        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>Here's where you stand today.</Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Solved" value={data.solvedCount} sublabel={`of ${data.totalProblemsCount} problems`} icon={CheckCircleRoundedIcon} accent="success.main" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Streak" value={`${data.streakDays} days`} sublabel={`Personal best: ${data.personalBestStreak}`} icon={LocalFireDepartmentRoundedIcon} accent="#FB6467" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <StatCard label="Upcoming" value={data.pendingCount} sublabel="Quizzes & tests" icon={AssignmentLateRoundedIcon} accent="secondary.main" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>This week's activity</Typography>
            <Box sx={{ height: 260 }}>
              <Line data={activityData} options={baseChartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>Upcoming</Typography>
            {data.upcomingEvents.length > 0 ? (
              <Stack spacing={2}>
                {data.upcomingEvents.map((item) => (
                  <Box key={item.id || item.title} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.when}</Typography>
                    </Box>
                    <Chip size="small" label={item.type} />
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
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>Recent submissions</Typography>
            {data.recentSubmissions.length > 0 ? (
              <Stack spacing={1.5}>
                {data.recentSubmissions.map((s, i) => (
                  <Box key={s.id || i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: i < data.recentSubmissions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{s.problemTitle}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.language} · {formatTimeAgo(s.createdAt)}</Typography>
                    </Box>
                    <VerdictChip verdict={s.verdict} />
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
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>Skill progress</Typography>
            {data.skillProgress.length > 0 ? (
              <Stack spacing={2}>
                {data.skillProgress.map((skill) => (
                  <Box key={skill.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{skill.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{skill.percentage}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Math.min(skill.percentage, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)' }} />
                  </Box>
                ))}
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
