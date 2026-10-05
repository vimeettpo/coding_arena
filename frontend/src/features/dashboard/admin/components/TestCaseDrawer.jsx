import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import adminService from '@/services/adminService';

const TestCaseDrawer = ({ open, problem, onClose }) => {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [outputVal, setOutputVal] = useState('');
  const [isHidden, setIsHidden] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTestCases = async () => {
    if (!problem) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getTestCases(problem.id);
      setTestCases(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch test cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && problem) {
      fetchTestCases();
      setInputVal('');
      setOutputVal('');
      setIsHidden(true);
      setError('');
      setSuccess('');
    }
  }, [open, problem]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!problem) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await adminService.addTestCase(problem.id, {
        input: inputVal,
        expectedOutput: outputVal,
        hidden: isHidden,
      });
      setInputVal('');
      setOutputVal('');
      setSuccess('Test case added successfully.');
      await fetchTestCases();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add test case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tcId) => {
    setError('');
    setSuccess('');
    try {
      await adminService.deleteTestCase(tcId);
      setTestCases((prev) => prev.filter((t) => t.id !== tcId));
      setSuccess('Test case removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete test case.');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 340, sm: 500 }, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
              Manage Test Cases
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Problem: <strong>{problem?.title}</strong>
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Add New Test Case Form */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0F172A' }}>
            Add New Evaluation Test Case
          </Typography>
          <Box component="form" onSubmit={handleAdd}>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Input Data (stdin)"
                placeholder="e.g. 5\n10 20 30 40 50"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                InputProps={{ sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' } }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Expected Output (stdout)"
                placeholder="e.g. 150"
                value={outputVal}
                onChange={(e) => setOutputVal(e.target.value)}
                InputProps={{ sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' } }}
              />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} color="primary" />
                  }
                  label={
                    <Typography variant="caption" fontWeight={600}>
                      {isHidden ? 'Hidden (Judge Only)' : 'Sample (Student Visible)'}
                    </Typography>
                  }
                />

                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />}
                  sx={{
                    bgcolor: '#F59E0B',
                    '&:hover': { bgcolor: '#D97706' },
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Add Test Case
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {/* Existing Test Cases List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0F172A' }}>
          Existing Test Cases ({testCases.length})
        </Typography>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#F59E0B' }} />
            </Box>
          ) : testCases.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No test cases added yet. Use the form above to add judge evaluation cases.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {testCases.map((tc, index) => (
                <Paper
                  key={tc.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        Case #{index + 1}
                      </Typography>
                      {tc.hidden ? (
                        <Chip label="Hidden" size="small" sx={{ bgcolor: 'rgba(100, 116, 139, 0.1)', color: '#475569', height: 20 }} />
                      ) : (
                        <Chip label="Sample" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', height: 20 }} />
                      )}
                    </Stack>
                    <IconButton size="small" onClick={() => handleDelete(tc.id)} sx={{ color: '#EF4444' }}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Input:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 1,
                      m: 0,
                      mb: 1,
                      bgcolor: '#F8FAFC',
                      borderRadius: 1,
                      fontSize: '0.78rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      overflowX: 'auto',
                    }}
                  >
                    {tc.input || '(empty)'}
                  </Box>

                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Expected Output:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 1,
                      m: 0,
                      bgcolor: '#F8FAFC',
                      borderRadius: 1,
                      fontSize: '0.78rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      overflowX: 'auto',
                    }}
                  >
                    {tc.expectedOutput || '(empty)'}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default TestCaseDrawer;
