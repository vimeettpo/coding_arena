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
  FormControlLabel,
  Switch,
  CircularProgress,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import adminService from '@/services/adminService';
import { COLLEGE_BRANCHES } from '../adminConstants';

const ContestDialog = ({ open, contest = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    targetBranch: 'ALL',
    targetYear: 'ALL',
    allowedLanguages: [],
    passingPercentage: 50,
    negativeMarking: false,
    problemIds: [],
  });

  const ALL_LANGUAGES = [
    { key: 'JAVA', label: 'Java' },
    { key: 'PYTHON', label: 'Python 3' },
    { key: 'CPP', label: 'C++' },
    { key: 'C', label: 'C' },
    { key: 'JAVASCRIPT', label: 'JavaScript' },
  ];

  const toggleLanguage = (langKey) => {
    setFormData((prev) => {
      const exists = prev.allowedLanguages.includes(langKey);
      return {
        ...prev,
        allowedLanguages: exists
          ? prev.allowedLanguages.filter((l) => l !== langKey)
          : [...prev.allowedLanguages, langKey],
      };
    });
  };

  const [availableProblems, setAvailableProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoadingProblems(true);
      adminService
        .getProblems({ size: 100 })
        .then((res) => {
          setAvailableProblems(res.content || []);
        })
        .catch(() => {})
        .finally(() => setLoadingProblems(false));

      if (contest) {
        setFormData({
          title: contest.title || '',
          description: contest.description || '',
          startTime: contest.startTime ? new Date(contest.startTime).toISOString().slice(0, 16) : '',
          endTime: contest.endTime ? new Date(contest.endTime).toISOString().slice(0, 16) : '',
          targetBranch: contest.targetBranch || 'ALL',
          targetYear: contest.targetYear || 'ALL',
          allowedLanguages: Array.isArray(contest.allowedLanguages) ? contest.allowedLanguages : [],
          passingPercentage: contest.passingPercentage || 50,
          negativeMarking: Boolean(contest.negativeMarking),
          problemIds: contest.problemIds || [],
        });
      } else {
        const now = new Date();
        const start = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins later
        const end = new Date(now.getTime() + 130 * 60 * 1000); // 2 hours later
        setFormData({
          title: '',
          description: '',
          startTime: start.toISOString().slice(0, 16),
          endTime: end.toISOString().slice(0, 16),
          targetBranch: 'ALL',
          targetYear: 'ALL',
          allowedLanguages: [],
          passingPercentage: 50,
          negativeMarking: false,
          problemIds: [],
        });
      }
      setError('');
    }
  }, [open, contest]);

  const toggleProblem = (id) => {
    setFormData((prev) => {
      const exists = prev.problemIds.includes(id);
      return {
        ...prev,
        problemIds: exists ? prev.problemIds.filter((p) => p !== id) : [...prev.problemIds, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.problemIds.length === 0) {
      setError('Please select at least one problem for this contest.');
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError('End time must be after the start time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        targetYear: formData.targetYear === 'ALL' ? null : Number(formData.targetYear),
        passingPercentage: Number(formData.passingPercentage) || 50,
      };

      if (contest) {
        await adminService.updateContest(contest.id, payload);
      } else {
        await adminService.createContest(payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save contest.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
        {contest ? 'Edit Assessment / Contest' : 'Schedule New Contest or Batch Test'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Contest / Test Title"
              required
              placeholder="e.g. Mock Placement Drive - Coding Round 1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Guidelines & Instructions"
              placeholder="Provide rules, scoring details, and instructions for students..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Target Branch"
                value={formData.targetBranch}
                onChange={(e) => setFormData({ ...formData, targetBranch: e.target.value })}
              >
                <MenuItem value="ALL">All Branches (Open Platform)</MenuItem>
                {COLLEGE_BRANCHES.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Target Academic Year"
                value={formData.targetYear}
                onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
              >
                <MenuItem value="ALL">All Academic Years</MenuItem>
                <MenuItem value={1}>1st Year (FE)</MenuItem>
                <MenuItem value={2}>2nd Year (SE)</MenuItem>
                <MenuItem value={3}>3rd Year (TE)</MenuItem>
                <MenuItem value={4}>Final Year (BE)</MenuItem>
              </TextField>
            </Stack>

            {/* Allowed Languages customization */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.75 }}>
                Allowed Programming Languages{' '}
                <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  ({formData.allowedLanguages.length === 0 ? 'All Languages Allowed' : `${formData.allowedLanguages.length} selected`})
                </Typography>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {ALL_LANGUAGES.map((lang) => {
                  const isSelected = formData.allowedLanguages.includes(lang.key);
                  return (
                    <Chip
                      key={lang.key}
                      label={lang.label}
                      onClick={() => toggleLanguage(lang.key)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected ? '#F59E0B' : 'transparent',
                        color: isSelected ? '#FFFFFF' : 'text.primary',
                        borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                type="number"
                label="Passing Percentage (%)"
                value={formData.passingPercentage}
                onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.negativeMarking}
                    onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                    color="primary"
                  />
                }
                label="Penalty for Wrong Submissions"
                sx={{ whiteSpace: 'nowrap' }}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                Select Problems from Code Bank ({formData.problemIds.length} selected)
              </Typography>

              {loadingProblems ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading problem bank...
                  </Typography>
                </Box>
              ) : availableProblems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No problems in bank yet. Create a question first in the Code Bank tab.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    maxHeight: 180,
                    overflowY: 'auto',
                    p: 1.5,
                    bgcolor: '#F8FAFC',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {availableProblems.map((p) => {
                    const isSelected = formData.problemIds.includes(p.id);
                    return (
                      <Chip
                        key={p.id}
                        label={`${p.title} (${p.difficulty})`}
                        onClick={() => toggleProblem(p.id)}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          bgcolor: isSelected ? '#F59E0B' : 'transparent',
                          color: isSelected ? '#FFFFFF' : 'text.primary',
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          </Stack>
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : contest ? 'Save Changes' : 'Create Contest'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContestDialog;
