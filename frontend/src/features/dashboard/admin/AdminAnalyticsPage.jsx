import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

import StatCard from '@/components/common/StatCard';
import { baseChartOptions } from '@/theme/chartSetup';
import adminService from '@/services/adminService';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [ov, ch] = await Promise.all([
        adminService.getOverview(),
        adminService.getChartsData(),
      ]);
      setOverview(ov);
      setCharts(ch);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Branch Performance Bar Chart
  const branchData = {
    labels: charts?.branchDistribution
      ? Object.keys(charts.branchDistribution).map((b) =>
          b.length > 22 ? b.substring(0, 20) + '…' : b
        )
      : [],
    datasets: [
      {
        label: 'Registered Students',
        data: charts?.branchDistribution ? Object.values(charts.branchDistribution) : [],
        backgroundColor: [
          '#F59E0B',
          '#7C5CFF',
          '#10B981',
          '#0284C7',
          '#6366F1',
          '#EC4899',
        ],
        borderRadius: 8,
      },
    ],
  };

  // Verdicts Doughnut
  const verdictData = {
    labels: charts?.verdictsBreakdown
      ? Object.keys(charts.verdictsBreakdown).map((v) => v.replace(/_/g, ' '))
      : ['Accepted', 'Wrong Answer', 'TLE', 'Compilation Error', 'Runtime Error'],
    datasets: [
      {
        data: charts?.verdictsBreakdown
          ? Object.values(charts.verdictsBreakdown)
          : [0, 0, 0, 0, 0],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#64748B', '#7C5CFF'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Language Breakdown Doughnut
  const languageData = {
    labels: charts?.languageUsage ? Object.keys(charts.languageUsage) : ['Java', 'Python', 'C++', 'C', 'JavaScript'],
    datasets: [
      {
        data: charts?.languageUsage
          ? Object.values(charts.languageUsage)
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
            Department Performance & Placement Analytics
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Submission accuracy, programming language trends, and branch placement readiness metrics.
          </Typography>
        </Box>

        <Tooltip title="Refresh Analytics Data">
          <IconButton
            onClick={fetchAnalytics}
            disabled={loading}
            sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}
          >
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Placement Readiness"
            value={loading ? '...' : `${overview?.activity?.placementReadinessScore || 0}%`}
            sublabel="Target cohort threshold"
            icon={WorkspacePremiumRoundedIcon}
            accent="#10B981"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Pass Rate"
            value={loading ? '...' : `${overview?.activity?.passRate || 0}%`}
            sublabel={`${overview?.activity?.acceptedSubmissions || 0} accepted`}
            icon={CheckCircleRoundedIcon}
            accent="#0284C7"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Submissions"
            value={loading ? '...' : String(overview?.activity?.totalSubmissions || 0)}
            sublabel="Campus-wide code runs"
            icon={TrendingUpRoundedIcon}
            accent="#F59E0B"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Sandbox Judge Status"
            value={overview?.system?.judgeSandbox === 'docker_active' ? 'Active' : 'Standby'}
            sublabel="Isolated execution sandbox"
            icon={StorageRoundedIcon}
            accent="#7C5CFF"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Branch Performance Comparison */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 380, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Student Enrollment Across Branches
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Comparison across the 6 approved college departments
            </Typography>
            <Box sx={{ height: 280 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={32} sx={{ color: '#F59E0B' }} />
                </Box>
              ) : (
                <Bar
                  data={branchData}
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

        {/* Verdicts Doughnut */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Submission Verdict Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              Accepted vs syntax and runtime errors
            </Typography>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <Doughnut data={verdictData} options={{ ...baseChartOptions, scales: undefined, cutout: '65%' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Programming Languages Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Programming Language Adoption
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              Distribution of student code submissions by language
            </Typography>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <Doughnut data={languageData} options={{ ...baseChartOptions, scales: undefined, cutout: '65%' }} />
            </Box>
          </Paper>
        </Grid>

        {/* System & Architecture Diagnostics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 340, bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Platform Diagnostics & Database Status
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
              Integrated cloud databases and judge health check
            </Typography>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="body2" fontWeight={600} color="#0F172A">
                  Neon PostgreSQL (Primary Auth & Users)
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.1)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                  ONLINE
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="body2" fontWeight={600} color="#0F172A">
                  MongoDB Atlas (Problems & Submissions)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: overview?.system?.mongo === 'connected' ? '#10B981' : '#F59E0B',
                    bgcolor: overview?.system?.mongo === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {overview?.system?.mongo === 'connected' ? 'CONNECTED' : 'STANDBY'}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="body2" fontWeight={600} color="#0F172A">
                  Isolated Code Sandbox
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284C7', bgcolor: 'rgba(2, 132, 199, 0.1)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                  SANDBOX READY
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight={600} color="#0F172A">
                  Server Timestamp
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: 'text.secondary' }}>
                  {overview?.system?.timestamp ? new Date(overview.system.timestamp).toLocaleString() : 'N/A'}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalyticsPage;
