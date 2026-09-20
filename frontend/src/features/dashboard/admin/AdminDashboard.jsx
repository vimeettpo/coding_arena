import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

import StatCard from '@/components/common/StatCard';
import { baseChartOptions } from '@/theme/chartSetup';
import adminService from '@/services/adminService';
import BulkImportModal from './components/BulkImportModal';
import ContestDialog from './components/ContestDialog';
import ProblemDialog from './components/ProblemDialog';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);

  // Dialogs
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [contestModalOpen, setContestModalOpen] = useState(false);
  const [problemModalOpen, setProblemModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, ch] = await Promise.all([
        adminService.getOverview(),
        adminService.getChartsData(),
      ]);
      setOverview(ov);
      setCharts(ch);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Branch Distribution Bar Chart Data
  const branchChartData = {
    labels: charts?.branchDistribution
      ? Object.keys(charts.branchDistribution).map((b) =>
          b.length > 20 ? b.substring(0, 18) + '…' : b
        )
      : [],
    datasets: [
      {
        label: 'Enrolled Students',
        data: charts?.branchDistribution ? Object.values(charts.branchDistribution) : [],
        backgroundColor: [
          '#F59E0B',
          '#7C5CFF',
          '#10B981',
          '#0284C7',
          '#6366F1',
          '#EC4899',
        ],
        borderRadius: 6,
      },
    ],
  };

  // Language Usage Doughnut Chart Data
  const languageData = {
    labels: charts?.languageUsage ? Object.keys(charts.languageUsage) : ['Java', 'Python', 'C++', 'C', 'JavaScript'],
    datasets: [
      {
        data: charts?.languageUsage
          ? Object.values(charts.languageUsage).map((v) => Math.max(v, 0))
          : [0, 0, 0, 0, 0],
        backgroundColor: ['#F59E0B', '#7C5CFF', '#10B981', '#0284C7', '#EF4444'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Faculty & Academic Administration
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            College-wide cohort management, placement readiness, and assessment monitoring.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh Platform Metrics">
            <IconButton
              onClick={fetchData}
              disabled={loading}
              sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}
            >
              <RefreshRoundedIcon fontSize="small" sx={{ animation: loading ? 'spin 1s infinite' : 'none' }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<FileUploadRoundedIcon />}
            onClick={() => setBulkModalOpen(true)}
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              px: 2.5,
            }}
          >
            Bulk Import Students
          </Button>
        </Stack>
      </Stack>

      {/* Teacher Quick Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3.5,
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mr: 1 }}>
          Faculty Shortcuts:
        </Typography>

        <Button
          size="small"
          variant="outlined"
          startIcon={<EmojiEventsRoundedIcon sx={{ color: '#F59E0B' }} />}
          onClick={() => setContestModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
        >
          Host Batch Contest
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddRoundedIcon sx={{ color: '#7C5CFF' }} />}
          onClick={() => setProblemModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
        >
          Add Question to Bank
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<GroupsRoundedIcon sx={{ color: '#0284C7' }} />}
          onClick={() => navigate('/admin/users')}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
        >
          Manage Students & Faculty
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<BarChartRoundedIcon sx={{ color: '#10B981' }} />}
          onClick={() => navigate('/admin/analytics')}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
        >
          Department Analytics
        </Button>
      </Paper>

      {/* KPI Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Students"
            value={loading ? '...' : String(overview?.users?.students || 0)}
            sublabel={`${overview?.users?.active || 0} active accounts`}
            icon={GroupsRoundedIcon}
            accent="#0284C7"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Faculty / Teachers"
            value={loading ? '...' : String(overview?.users?.faculty || 0)}
            sublabel="Active instructors"
            icon={SchoolRoundedIcon}
            accent="#7C5CFF"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Contests / Tests"
            value={loading ? '...' : String(overview?.content?.totalContests || 0)}
            sublabel={`${overview?.content?.activeContests || 0} live right now`}
            icon={EmojiEventsRoundedIcon}
            accent="#10B981"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Code Bank Problems"
            value={loading ? '...' : String(overview?.content?.totalProblems || 0)}
            sublabel={`${overview?.content?.publishedProblems || 0} published questions`}
            icon={CodeRoundedIcon}
            accent="#F59E0B"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Branch Distribution Bar Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 360, bgcolor: '#FFFFFF' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  Student Enrollment by College Branch
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distribution across the 6 institutional departments
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ height: 270 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={32} sx={{ color: '#F59E0B' }} />
                </Box>
              ) : (
                <Bar
                  data={branchChartData}
                  options={{
                    ...baseChartOptions,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } },
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Language Usage Doughnut */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 360, display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5, fontWeight: 700, color: '#0F172A' }}>
              Submissions by Language
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              Preferred programming stacks across cohorts
            </Typography>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <Doughnut data={languageData} options={{ ...baseChartOptions, scales: undefined, cutout: '65%' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Submissions Feed */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
              Live Platform Evaluation Feed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time student code submissions across practice problems and contests
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => navigate('/admin/analytics')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View Full Analytics →
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#F59E0B' }} />
          </Box>
        ) : !charts?.recentSubmissions || charts.recentSubmissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No recent submissions recorded yet. Once students begin submitting solutions, live verdicts will appear here.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {charts.recentSubmissions.map((item) => {
              const isAccepted = item.verdict === 'ACCEPTED';
              return (
                <Stack
                  key={item.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{
                    py: 1.25,
                    px: 1.5,
                    borderRadius: 2,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {isAccepted ? (
                      <CheckCircleRoundedIcon sx={{ color: '#10B981', fontSize: 20 }} />
                    ) : (
                      <CancelRoundedIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="#0F172A">
                        {item.problemTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Language: <strong>{item.language}</strong> • Runtime: {item.runtimeMs}ms
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 1, sm: 0 } }}>
                    <Chip
                      size="small"
                      label={item.verdict}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: isAccepted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: isAccepted ? '#10B981' : '#EF4444',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Modals */}
      <BulkImportModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchData}
      />
      <ContestDialog
        open={contestModalOpen}
        onClose={() => setContestModalOpen(false)}
        onSuccess={fetchData}
      />
      <ProblemDialog
        open={problemModalOpen}
        onClose={() => setProblemModalOpen(false)}
        onSuccess={fetchData}
      />
    </Box>
  );
};

export default AdminDashboard;
