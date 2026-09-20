import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import adminService from '@/services/adminService';
import { COLLEGE_BRANCHES, ACADEMIC_YEARS, USER_ROLES } from '../adminConstants';

const UserActionModal = ({ open, mode = 'create', user = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    collegeId: '',
    branch: '',
    year: '',
    teachingDomain: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'STUDENT',
        collegeId: user.collegeId || '',
        branch: user.branch || '',
        year: user.year || '',
        teachingDomain: user.teachingDomain || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        password: 'ChangeMe@123',
        role: 'STUDENT',
        collegeId: '',
        branch: COLLEGE_BRANCHES[0],
        year: 1,
        teachingDomain: '',
      });
    }
    setError('');
    setNewPassword('');
  }, [user, mode, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'create') {
        await adminService.createUser({
          ...formData,
          year: formData.year ? parseInt(formData.year, 10) : null,
        });
      } else if (mode === 'edit') {
        await adminService.updateUser(user.id, {
          name: formData.name,
          collegeId: formData.collegeId,
          branch: formData.branch,
          year: formData.year ? parseInt(formData.year, 10) : null,
          teachingDomain: formData.teachingDomain,
        });
        if (formData.role !== user.role) {
          await adminService.updateUserRole(user.id, formData.role);
        }
      } else if (mode === 'password') {
        if (!newPassword || newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await adminService.resetUserPassword(user.id, newPassword);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
        {mode === 'create' && 'Add New Student or Faculty'}
        {mode === 'edit' && `Edit Profile — ${user?.name}`}
        {mode === 'password' && `Reset Password — ${user?.email}`}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {mode === 'password' ? (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Enter a strong new password (minimum 6 characters)."
              />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              {mode === 'create' && (
                <>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Initial Password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </>
              )}

              <TextField
                select
                fullWidth
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {USER_ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="College / Roll ID"
                placeholder="e.g. V24CS001"
                value={formData.collegeId}
                onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
              />

              <TextField
                select
                fullWidth
                label="College Branch"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              >
                <MenuItem value="">-- Select Branch --</MenuItem>
                {COLLEGE_BRANCHES.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </TextField>

              {formData.role === 'STUDENT' ? (
                <TextField
                  select
                  fullWidth
                  label="Academic Year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                >
                  <MenuItem value="">-- Select Year --</MenuItem>
                  {ACADEMIC_YEARS.map((y) => (
                    <MenuItem key={y.value} value={y.value}>
                      {y.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Teaching Domain / Specialization"
                  placeholder="e.g. Data Structures, Web Development"
                  value={formData.teachingDomain}
                  onChange={(e) => setFormData({ ...formData, teachingDomain: e.target.value })}
                />
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserActionModal;
