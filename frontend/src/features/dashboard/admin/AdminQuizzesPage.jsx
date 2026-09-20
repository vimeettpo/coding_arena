import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';

import quizService from '@/services/quizService';
import QuizLeaderboardModal from '@/components/common/QuizLeaderboardModal';
import QuizDialog from './components/QuizDialog';

const AdminQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Leaderboard Modal
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quizService.list();
      setQuizzes(res.data || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleOpenLeaderboard = (q) => {
    setSelectedQuizId(q.id);
    setSelectedQuizTitle(q.title);
    setLeaderboardOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    setDeleting(true);
    try {
      await quizService.delete(quizToDelete.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      setDeleteOpen(false);
      setQuizToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete test.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch = q.title?.toLowerCase().includes(search.toLowerCase().trim());
    if (statusTab === 'ALL') return matchesSearch;
    return matchesSearch && q.status === statusTab;
  });

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
            Faculty Tests & MCQs Hub
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Build timed MCQ exams, automated grading tests, and review individual test standings.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{
            bgcolor: '#7C5CFF',
            '&:hover': { bgcolor: '#6366F1' },
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: 2,
            textTransform: 'none',
            px: 2.5,
          }}
        >
          Create New Test
        </Button>
      </Stack>

      {/* Filter Tabs & Search */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Tabs
            value={statusTab}
            onChange={(_e, v) => setStatusTab(v)}
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab value="ALL" label="All Tests" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="LIVE" label="Live Now" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="UPCOMING" label="Upcoming" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="ENDED" label="Concluded" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          <TextField
            size="small"
            sx={{ width: { xs: '100%', md: 320 } }}
            placeholder="Search test by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Paper>

      {/* Tests Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>Test Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total Marks</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Question Mix</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Allowed Languages</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Target Group</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total Marks</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} sx={{ color: '#7C5CFF' }} />
                </TableCell>
              </TableRow>
            ) : filteredQuizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No tests found. Click "Create New Test" to schedule an assessment.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuizzes.map((q) => {
                const isLive = q.status === 'LIVE';
                const isUpcoming = q.status === 'UPCOMING';
                const mcqCount = q.questionCount ?? (q.questions ? q.questions.length : 0);
                const codingCount = q.codingCount ?? (q.codingProblems ? q.codingProblems.length : 0);
                const langLabel =
                  q.allowedLanguages && q.allowedLanguages.length > 0
                    ? q.allowedLanguages.join(', ')
                    : 'All Languages';

                const branchLabel = q.targetBranch && q.targetBranch !== 'ALL' ? q.targetBranch : 'All Branches';
                const yearLabel = q.targetYear ? `Year ${q.targetYear}` : null;

                return (
                  <TableRow key={q.id} hover sx={{ '& td': { borderColor: '#E2E8F0' } }}>
                    <TableCell>
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
                          <Typography variant="body2" fontWeight={700} color="#0F172A">
                            {q.title}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                            <ScheduleRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {q.durationMinutes || 30} mins
                            </Typography>
                            {q.negativeMarking && (
                              <Chip
                                size="small"
                                label={`-${q.negativeMarks || 1} Neg`}
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {mcqCount > 0 && (
                          <Chip
                            size="small"
                            label={`${mcqCount} MCQ${mcqCount > 1 ? 's' : ''}`}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#EDE9FE', color: '#6D28D9' }}
                          />
                        )}
                        {codingCount > 0 && (
                          <Chip
                            size="small"
                            label={`${codingCount} Coding`}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }}
                          />
                        )}
                        {mcqCount === 0 && codingCount === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            0 Questions
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={langLabel}
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          borderColor: q.allowedLanguages?.length > 0 ? '#F59E0B' : '#CBD5E1',
                          color: q.allowedLanguages?.length > 0 ? '#B45309' : '#64748B',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', display: 'block' }}>
                        {branchLabel}
                      </Typography>
                      {yearLabel && (
                        <Typography variant="caption" color="text.secondary">
                          {yearLabel}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        {q.totalMarks || 0} pts
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'ENDED'}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor: isLive
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isUpcoming
                            ? 'rgba(2, 132, 199, 0.15)'
                            : 'rgba(100, 116, 139, 0.1)',
                          color: isLive ? '#10B981' : isUpcoming ? '#0284C7' : '#64748B',
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmojiEventsRoundedIcon sx={{ color: '#F59E0B' }} />}
                          onClick={() => handleOpenLeaderboard(q)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: '#E2E8F0',
                            color: '#0F172A',
                            '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.05)' },
                          }}
                        >
                          Leaderboard
                        </Button>

                        <Tooltip title="Delete Test">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setQuizToDelete(q);
                              setDeleteOpen(true);
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#EF4444' }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Quiz Leaderboard Modal */}
      <QuizLeaderboardModal
        open={leaderboardOpen}
        quizId={selectedQuizId}
        quizTitle={selectedQuizTitle}
        onClose={() => setLeaderboardOpen(false)}
      />

      {/* Modern Quiz Dialog */}
      <QuizDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchQuizzes}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Test Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{quizToDelete?.title}</strong>? All student attempts
            and scores for this test will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDeleteConfirm}
            sx={{ borderRadius: 2 }}
          >
            {deleting ? 'Deleting...' : 'Delete Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuizzesPage;
