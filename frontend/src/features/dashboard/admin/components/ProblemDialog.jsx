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
  Typography,
} from '@mui/material';
import adminService from '@/services/adminService';
import { PROBLEM_DIFFICULTIES } from '../adminConstants';

const ProblemDialog = ({ open, problem = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'MEDIUM',
    description: '',
    constraints: '',
    editorial: '',
    tagsString: '',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    published: true,
    sampleInput: '',
    sampleOutput: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (problem) {
      setFormData({
        title: problem.title || '',
        difficulty: problem.difficulty || 'MEDIUM',
        description: problem.description || '',
        constraints: problem.constraints || '',
        editorial: problem.editorial || '',
        tagsString: (problem.tags || []).join(', '),
        timeLimitMs: problem.timeLimitMs || 1000,
        memoryLimitMb: problem.memoryLimitMb || 256,
        published: problem.published !== false,
        sampleInput: '',
        sampleOutput: '',
      });
    } else {
      setFormData({
        title: '',
        difficulty: 'MEDIUM',
        description: '',
        constraints: '',
        editorial: '',
        tagsString: 'Arrays, Algorithms',
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        published: true,
        sampleInput: '',
        sampleOutput: '',
      });
    }
    setError('');
  }, [problem, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const tags = formData.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: formData.title,
      difficulty: formData.difficulty,
      description: formData.description,
      constraints: formData.constraints,
      editorial: formData.editorial,
      tags,
      timeLimitMs: parseInt(formData.timeLimitMs, 10),
      memoryLimitMb: parseInt(formData.memoryLimitMb, 10),
      published: Boolean(formData.published),
    };

    if (!problem && (formData.sampleInput || formData.sampleOutput)) {
      payload.sampleTestCases = [
        {
          input: formData.sampleInput,
          expectedOutput: formData.sampleOutput,
        },
      ];
    }

    setSubmitting(true);
    try {
      if (problem) {
        await adminService.updateProblem(problem.id, payload);
      } else {
        await adminService.createProblem(payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
        {problem ? 'Edit Code Bank Problem' : 'Author New Problem for Code Bank'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Problem Title"
                required
                placeholder="e.g. Find Longest Subarray with Sum K"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <TextField
                select
                sx={{ minWidth: 160 }}
                label="Difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                {PROBLEM_DIFFICULTIES.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    color="primary"
                  />
                }
                label={formData.published ? 'Published' : 'Draft'}
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={5}
              label="Problem Statement"
              required
              placeholder="Describe the problem, input format, and output format..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Constraints"
              placeholder="e.g. 1 <= N <= 10^5, 0 <= arr[i] <= 10^9"
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                placeholder="e.g. Arrays, Two Pointers, Dynamic Programming"
                value={formData.tagsString}
                onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
              />

              <TextField
                type="number"
                label="Time Limit (ms)"
                sx={{ width: 160 }}
                value={formData.timeLimitMs}
                onChange={(e) => setFormData({ ...formData, timeLimitMs: e.target.value })}
              />

              <TextField
                type="number"
                label="Memory Limit (MB)"
                sx={{ width: 160 }}
                value={formData.memoryLimitMb}
                onChange={(e) => setFormData({ ...formData, memoryLimitMb: e.target.value })}
              />
            </Stack>

            {!problem && (
              <Stack spacing={1.5} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Initial Sample Test Case (Optional)
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Sample Input"
                    placeholder="e.g. 5\n1 2 3 4 5"
                    value={formData.sampleInput}
                    onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Expected Output"
                    placeholder="e.g. 15"
                    value={formData.sampleOutput}
                    onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                  />
                </Stack>
              </Stack>
            )}
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : problem ? 'Update Problem' : 'Create Problem'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProblemDialog;
