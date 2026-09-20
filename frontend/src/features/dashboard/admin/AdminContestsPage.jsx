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
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';

import adminService from '@/services/adminService';
import ContestDialog from './components/ContestDialog';
import ContestLeaderboardModal from '@/components/common/ContestLeaderboardModal';

const AdminContestsPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Dialogs
  const [contestDialogOpen, setContestDialogOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);

  // Dedicated Leaderboard Modal
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedContestForLeaderboard, setSelectedContestForLeaderboard] = useState(null);

  // Participants Dialog
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [currentContestTitle, setCurrentContestTitle] = useState('');

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getContests({
        status: statusTab === 'ALL' ? '' : statusTab,
        search,
      });
      setContests(data);
    } catch (err) {
      console.error('Failed to load contests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusTab, search]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const handleOpenParticipants = async (c) => {
    setCurrentContestTitle(c.title);
    setParticipantsOpen(true);
    setLoadingParticipants(true);
    try {
      const list = await adminService.getContestParticipants(c.id);
      setParticipantsList(list);
    } catch (err) {
      console.error('Failed to load participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contestToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteContest(contestToDelete.id);
      setContests((prev) => prev.filter((c) => c.id !== contestToDelete.id));
      setDeleteDialogOpen(false);
      setContestToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete contest.');
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
            Assessments & Contests Hub
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Schedule and oversee campus coding drives, class tests, and department assessments.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedContest(null);
            setContestDialogOpen(true);
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
          Schedule Assessment / Contest
        </Button>
      </Stack>

      {/* Tabs & Search */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Tabs
            value={statusTab}
            onChange={(_e, v) => setStatusTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value="ALL" label="All Assessments" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="RUNNING" label="Live Now" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="UPCOMING" label="Upcoming" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="ENDED" label="Concluded" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          <TextField
            size="small"
            sx={{ width: { xs: '100%', md: 300 } }}
            placeholder="Search assessment by title..."
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

      {/* Contests Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>Contest Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Target Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Schedule & Duration</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Problems</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Registered</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} sx={{ color: '#F59E0B' }} />
                </TableCell>
              </TableRow>
            ) : contests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No contests found. Click "Schedule Assessment" to create your first contest.
                </TableCell>
              </TableRow>
            ) : (
              contests.map((c) => {
                const isLive = c.status === 'RUNNING';
                const isUpcoming = c.status === 'UPCOMING';
                return (
                  <TableRow key={c.id} hover sx={{ '& td': { borderColor: '#E2E8F0' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: isLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isLive ? '#10B981' : '#D97706',
                            display: 'flex',
                          }}
                        >
                          <EmojiEventsRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#0F172A">
                            {c.title}
                          </Typography>
                          {c.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: 280,
                              }}
                            >
                              {c.description}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={c.targetBranch || 'ALL'}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          bgcolor: c.targetBranch === 'ALL' ? '#F1F5F9' : 'rgba(124, 92, 255, 0.1)',
                          color: c.targetBranch === 'ALL' ? '#475569' : '#7C5CFF',
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {new Date(c.startTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        to{' '}
                        {new Date(c.endTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        {c.problemCount}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => handleOpenParticipants(c)}
                        startIcon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#0284C7',
                        }}
                      >
                        {c.participantCount}
                      </Button>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={isLive ? 'LIVE NOW' : isUpcoming ? 'UPCOMING' : 'CONCLUDED'}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor: isLive
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isUpcoming
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(100, 116, 139, 0.1)',
                          color: isLive ? '#10B981' : isUpcoming ? '#D97706' : '#64748B',
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmojiEventsRoundedIcon sx={{ color: '#F59E0B' }} />}
                          onClick={() => {
                            setSelectedContestForLeaderboard(c);
                            setLeaderboardOpen(true);
                          }}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            borderColor: '#E2E8F0',
                            color: '#0F172A',
                            '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.05)' },
                          }}
                        >
                          Leaderboard
                        </Button>

                        <Tooltip title="View Participant Submissions">
                          <IconButton size="small" onClick={() => handleOpenParticipants(c)}>
                            <GroupsRoundedIcon fontSize="small" sx={{ color: '#0284C7' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Contest">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedContest(c);
                              setContestDialogOpen(true);
                            }}
                          >
                            <EditRoundedIcon fontSize="small" sx={{ color: '#64748B' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Contest">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setContestToDelete(c);
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
      </Paper>

      {/* Contest Dialog */}
      <ContestDialog
        open={contestDialogOpen}
        contest={selectedContest}
        onClose={() => setContestDialogOpen(false)}
        onSuccess={fetchContests}
      />

      {/* Participants & Scores Modal */}
      <Dialog
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Participants & Leaderboard — {currentContestTitle}
        </DialogTitle>
        <DialogContent dividers>
          {loadingParticipants ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={28} sx={{ color: '#F59E0B' }} />
            </Box>
          ) : participantsList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No students have registered for this contest yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Problems Solved</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participantsList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.branch}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10B981' }}>
                      {p.problemsSolved}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>
                      {p.score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setParticipantsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Contest Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Contest Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{contestToDelete?.title}</strong>? All registered
            submissions and participant rank scores will be permanently deleted.
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
            {deleting ? 'Deleting...' : 'Delete Contest'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dedicated Contest Leaderboard Modal */}
      <ContestLeaderboardModal
        open={leaderboardOpen}
        contestId={selectedContestForLeaderboard?.id}
        contestTitle={selectedContestForLeaderboard?.title}
        onClose={() => setLeaderboardOpen(false)}
      />
    </Box>
  );
};

export default AdminContestsPage;
