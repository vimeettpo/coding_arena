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
  IconButton,
  Tooltip,
  CircularProgress,
  MenuItem,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';

import adminService from '@/services/adminService';
import ProblemDialog from './components/ProblemDialog';
import TestCaseDrawer from './components/TestCaseDrawer';

const AdminQuestionsPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [published, setPublished] = useState('');

  // Dialogs
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  // Test Case Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [problemForDrawer, setProblemForDrawer] = useState(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getProblems({
        page,
        size: 15,
        search,
        difficulty,
        published,
      });
      setProblems(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, published]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleTogglePublish = async (p) => {
    try {
      const res = await adminService.togglePublishProblem(p.id);
      setProblems((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, published: res.published } : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle publish status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!problemToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteProblem(problemToDelete.id);
      setProblems((prev) => prev.filter((p) => p.id !== problemToDelete.id));
      setDeleteDialogOpen(false);
      setProblemToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete problem.');
    } finally {
      setDeleting(false);
    }
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
            Faculty Code Bank & Questions
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Author, moderate, and manage coding challenges, test cases, and problem visibility.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedProblem(null);
            setProblemDialogOpen(true);
          }}
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
          Author New Problem
        </Button>
      </Stack>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            fullWidth
            placeholder="Search questions by title or tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            sx={{ minWidth: 160 }}
            label="Difficulty"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Difficulties</MenuItem>
            <MenuItem value="EASY">Easy</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HARD">Hard</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            sx={{ minWidth: 160 }}
            label="Status"
            value={published}
            onChange={(e) => {
              setPublished(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="true">Published</MenuItem>
            <MenuItem value="false">Draft</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* Questions Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>Problem Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Test Cases</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Limits</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Visibility</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} sx={{ color: '#F59E0B' }} />
                </TableCell>
              </TableRow>
            ) : problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No questions match your query. Click "Author New Problem" to create one.
                </TableCell>
              </TableRow>
            ) : (
              problems.map((p) => {
                const isEasy = p.difficulty === 'EASY';
                const isMedium = p.difficulty === 'MEDIUM';
                return (
                  <TableRow key={p.id} hover sx={{ '& td': { borderColor: '#E2E8F0' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                            color: '#D97706',
                            display: 'flex',
                          }}
                        >
                          <CodeRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#0F172A">
                            {p.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {(p.tags || []).slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#F1F5F9' }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={p.difficulty}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: isEasy
                            ? 'rgba(16, 185, 129, 0.12)'
                            : isMedium
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                          color: isEasy ? '#10B981' : isMedium ? '#D97706' : '#EF4444',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ScienceRoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => {
                          setProblemForDrawer(p);
                          setDrawerOpen(true);
                        }}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          py: 0.25,
                        }}
                      >
                        {p.sampleTestCasesCount || 0}s / {p.hiddenTestCasesCount || 0}h
                      </Button>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: 'text.secondary' }}>
                        {p.timeLimitMs}ms • {p.memoryLimitMb}MB
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <Switch
                          size="small"
                          checked={p.published}
                          onChange={() => handleTogglePublish(p)}
                          color="primary"
                        />
                        <Typography variant="caption" fontWeight={600} color={p.published ? '#10B981' : '#64748B'}>
                          {p.published ? 'Live' : 'Draft'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Manage Test Cases">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProblemForDrawer(p);
                              setDrawerOpen(true);
                            }}
                          >
                            <ScienceRoundedIcon fontSize="small" sx={{ color: '#0284C7' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Problem">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProblem(p);
                              setProblemDialogOpen(true);
                            }}
                          >
                            <EditRoundedIcon fontSize="small" sx={{ color: '#64748B' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Problem">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProblemToDelete(p);
                              setDeleteDialogOpen(true);
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

        {/* Pagination */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {problems.length} of {totalElements} questions
          </Typography>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_e, p) => setPage(p - 1)}
            color="primary"
            size="small"
          />
        </Box>
      </Paper>

      {/* Problem Dialog */}
      <ProblemDialog
        open={problemDialogOpen}
        problem={selectedProblem}
        onClose={() => setProblemDialogOpen(false)}
        onSuccess={fetchProblems}
      />

      {/* Test Case Drawer */}
      <TestCaseDrawer
        open={drawerOpen}
        problem={problemForDrawer}
        onClose={() => {
          setDrawerOpen(false);
          fetchProblems();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Problem Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{problemToDelete?.title}</strong>? All associated
            test cases and student submission history for this problem will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDeleteConfirm}
            sx={{ borderRadius: 2 }}
          >
            {deleting ? 'Deleting...' : 'Delete Problem'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuestionsPage;
