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
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import adminService from '@/services/adminService';
import { COLLEGE_BRANCHES, ACADEMIC_YEARS } from './adminConstants';
import UserActionModal from './components/UserActionModal';
import BulkImportModal from './components/BulkImportModal';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleTab, setRoleTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalMode, setActionModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Delete Confirmation Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const roleParam = roleTab === 'ALL' ? '' : roleTab;
      const res = await adminService.getUsers({
        page,
        size: 15,
        search,
        role: roleParam,
        branch: selectedBranch,
        year: selectedYear,
        status: selectedStatus,
      });
      setUsers(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleTab, search, selectedBranch, selectedYear, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTabChange = (_e, newValue) => {
    setRoleTab(newValue);
    setPage(0);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await adminService.exportUsersCSV(
        roleTab === 'ALL' ? '' : roleTab,
        selectedBranch
      );
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `codearena_users_${roleTab.toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminService.updateUserStatus(user.id, !user.enabled);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: !u.enabled } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Students & Faculty Management
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Browse, onboard, and manage institutional student accounts and faculty members.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileUploadRoundedIcon />}
            onClick={() => setBulkModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#0F172A', fontWeight: 600 }}
          >
            Bulk Import
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => {
              setSelectedUser(null);
              setActionModalMode('create');
              setActionModalOpen(true);
            }}
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
            }}
          >
            Add Single User
          </Button>
        </Stack>
      </Stack>

      {/* Role Tabs */}
      <Paper elevation={0} sx={{ mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Tabs
          value={roleTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab value="ALL" label="All Accounts" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab value="STUDENT" label="Students" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab value="TRAINER" label="Faculty / Trainers" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab value="ADMIN" label="System Admins" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {/* Filters Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <GridFilterBar
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setPage(0);
          }}
          selectedBranch={selectedBranch}
          setSelectedBranch={(v) => {
            setSelectedBranch(v);
            setPage(0);
          }}
          selectedYear={selectedYear}
          setSelectedYear={(v) => {
            setSelectedYear(v);
            setPage(0);
          }}
          selectedStatus={selectedStatus}
          setSelectedStatus={(v) => {
            setSelectedStatus(v);
            setPage(0);
          }}
        />
      </Paper>

      {/* Users Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>User Profile</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Roll / College ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch & Year</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No user records match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isStudent = u.role === 'STUDENT';
                const isTrainer = u.role === 'TRAINER';
                return (
                  <TableRow key={u.id} hover sx={{ '& td': { borderColor: '#E2E8F0' } }}>
                    {/* User Profile */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: '0.85rem',
                            bgcolor: isTrainer ? 'rgba(124, 92, 255, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isTrainer ? '#7C5CFF' : '#D97706',
                            fontWeight: 700,
                          }}
                        >
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#0F172A">
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* College ID */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        {u.collegeId || '—'}
                      </Typography>
                    </TableCell>

                    {/* Branch & Year */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {u.branch || '—'}
                      </Typography>
                      {isStudent && u.year ? (
                        <Typography variant="caption" color="text.secondary">
                          Year {u.year}
                        </Typography>
                      ) : isTrainer && u.teachingDomain ? (
                        <Typography variant="caption" color="text.secondary">
                          Specialization: {u.teachingDomain}
                        </Typography>
                      ) : null}
                    </TableCell>

                    {/* Role */}
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={u.role}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor:
                            u.role === 'ADMIN'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : isTrainer
                              ? 'rgba(124, 92, 255, 0.1)'
                              : 'rgba(2, 132, 199, 0.1)',
                          color:
                            u.role === 'ADMIN'
                              ? '#EF4444'
                              : isTrainer
                              ? '#7C5CFF'
                              : '#0284C7',
                        }}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      {u.enabled ? (
                        <Chip
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Active"
                          size="small"
                          sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          icon={<BlockRoundedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Disabled"
                          size="small"
                          sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 600 }}
                        />
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit Profile / Role">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(u);
                              setActionModalMode('edit');
                              setActionModalOpen(true);
                            }}
                          >
                            <EditRoundedIcon fontSize="small" sx={{ color: '#64748B' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(u);
                              setActionModalMode('password');
                              setActionModalOpen(true);
                            }}
                          >
                            <LockResetRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={u.enabled ? 'Disable Account' : 'Activate Account'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(u)}>
                            {u.enabled ? (
                              <BlockRoundedIcon fontSize="small" sx={{ color: '#EF4444' }} />
                            ) : (
                              <CheckCircleRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Account">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setUserToDelete(u);
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
            Showing {users.length} of {totalElements} users
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

      {/* Modals */}
      <UserActionModal
        open={actionModalOpen}
        mode={actionModalMode}
        user={selectedUser}
        onClose={() => setActionModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <BulkImportModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
            This will permanently remove their records and auth access.
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
            {deleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const GridFilterBar = ({
  search,
  setSearch,
  selectedBranch,
  setSelectedBranch,
  selectedYear,
  setSelectedYear,
  selectedStatus,
  setSelectedStatus,
}) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
    <TextField
      size="small"
      fullWidth
      placeholder="Search by name, email, or Roll ID..."
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

    <TextField
      select
      size="small"
      sx={{ minWidth: { xs: '100%', sm: 220 } }}
      label="Filter Branch"
      value={selectedBranch}
      onChange={(e) => setSelectedBranch(e.target.value)}
    >
      <MenuItem value="">All Branches</MenuItem>
      {COLLEGE_BRANCHES.map((b) => (
        <MenuItem key={b} value={b}>
          {b}
        </MenuItem>
      ))}
    </TextField>

    <TextField
      select
      size="small"
      sx={{ minWidth: { xs: '100%', sm: 140 } }}
      label="Academic Year"
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
    >
      <MenuItem value="">All Years</MenuItem>
      {ACADEMIC_YEARS.map((y) => (
        <MenuItem key={y.value} value={y.value}>
          {y.label}
        </MenuItem>
      ))}
    </TextField>

    <TextField
      select
      size="small"
      sx={{ minWidth: { xs: '100%', sm: 130 } }}
      label="Status"
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
    >
      <MenuItem value="">All Statuses</MenuItem>
      <MenuItem value="active">Active</MenuItem>
      <MenuItem value="disabled">Disabled</MenuItem>
    </TextField>
  </Stack>
);

export default AdminUsersPage;
