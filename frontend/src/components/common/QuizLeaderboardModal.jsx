import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Chip,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import quizService from '@/services/quizService';

const QuizLeaderboardModal = ({ open, quizId, quizTitle = '', onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && quizId) {
      setLoading(true);
      setError('');
      quizService
        .getLeaderboard(quizId)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load test leaderboard.');
        })
        .finally(() => setLoading(false));
    }
  }, [open, quizId]);

  const filteredStandings = useMemo(() => {
    if (!data?.standings) return [];
    if (!search.trim()) return data.standings;
    const q = search.toLowerCase().trim();
    return data.standings.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.collegeId && s.collegeId.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q))
    );
  }, [data, search]);

  const handleExportCSV = () => {
    if (!data?.standings || data.standings.length === 0) return;
    const header = ['Rank', 'Name', 'Email', 'College ID', 'Branch', 'Score', 'Total Marks', 'Percentage', 'Submitted At'];
    const rows = data.standings.map((s) => [
      s.rank,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${s.collegeId || ''}"`,
      `"${s.branch || ''}"`,
      s.score,
      s.totalMarks,
      `${s.percentage}%`,
      s.submittedAt ? new Date(s.submittedAt).toISOString() : '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.quizTitle || 'test').replace(/\s+/g, '_')}_leaderboard.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: 'rgba(124, 92, 255, 0.12)',
                color: '#7C5CFF',
                display: 'flex',
              }}
            >
              <QuizRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
                Assessment / Test Standings
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data?.quizTitle || quizTitle || 'Class Assessment'}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2.5 }}>
          <TextField
            size="small"
            placeholder="Search student by name, Roll ID, or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExportCSV}
            disabled={!data?.standings || data.standings.length === 0}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#0F172A' }}
          >
            Export Standings (.CSV)
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#7C5CFF' }} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>
            {error}
          </Typography>
        ) : filteredStandings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            No student submissions recorded for this test yet.
          </Typography>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, width: 80 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Roll ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Marks Obtained</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStandings.map((s) => {
                  return (
                    <TableRow key={s.userId} hover sx={{ '& td': { borderColor: '#E2E8F0' } }}>
                      <TableCell align="center">
                        {s.rank === 1 ? (
                          <Chip label="#1 🥇" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800 }} />
                        ) : s.rank === 2 ? (
                          <Chip label="#2 🥈" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                        ) : s.rank === 3 ? (
                          <Chip label="#3 🥉" size="small" sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 800 }} />
                        ) : (
                          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'text.secondary' }}>
                            #{s.rank}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.email}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.collegeId || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {s.branch || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#7C5CFF' }}>
                          {s.score} / {s.totalMarks}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          label={`${s.percentage}%`}
                          size="small"
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                            bgcolor: s.percentage >= 75 ? 'rgba(16, 185, 129, 0.12)' : s.percentage >= 40 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: s.percentage >= 75 ? '#10B981' : s.percentage >= 40 ? '#D97706' : '#EF4444',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizLeaderboardModal;
