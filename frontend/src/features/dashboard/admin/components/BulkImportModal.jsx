import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  Stack,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import adminService from '@/services/adminService';
import { COLLEGE_BRANCHES } from '../adminConstants';

const SAMPLE_CSV = `Name,Email,College ID,Branch,Year
Aarav Sharma,aarav.sharma@vimeet.ac.in,V24CS001,Computer Engineering,3
Pooja Patil,pooja.patil@vimeet.ac.in,V24AI012,Computer Science Engineering (AI&ML),2
Rohan Deshmukh,rohan.d@vimeet.ac.in,V24CV045,Civil Engineering,4
Neha Joshi,neha.j@vimeet.ac.in,V24EX089,EXTC Engineering,3
Kunal Kulkarni,kunal.k@vimeet.ac.in,V24ME034,Mechanical Engineering,2
Suresh More,suresh.m@vimeet.ac.in,V24EE011,Electrical Engineering,1`;

const BulkImportModal = ({ open, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('Student@123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target.result || '');
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one student data row.');
    }

    const rows = lines.slice(1);
    const parsedStudents = [];

    rows.forEach((line, index) => {
      // Split by comma ignoring quotes
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 5) {
        throw new Error(`Row ${index + 2} is missing fields. Expected: Name, Email, College ID, Branch, Year`);
      }

      const [name, email, collegeId, branch, yearStr] = parts;
      const year = parseInt(yearStr, 10);

      if (!name || !email) {
        throw new Error(`Row ${index + 2} has empty name or email.`);
      }

      if (!COLLEGE_BRANCHES.includes(branch)) {
        throw new Error(
          `Row ${index + 2}: Branch "${branch}" is not valid. Must be one of:\n${COLLEGE_BRANCHES.join(', ')}`
        );
      }

      if (isNaN(year) || year < 1 || year > 4) {
        throw new Error(`Row ${index + 2}: Year must be between 1 and 4.`);
      }

      parsedStudents.push({
        name,
        email,
        collegeId: collegeId || '',
        branch,
        year,
        role: 'STUDENT',
      });
    });

    return parsedStudents;
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setResult(null);
      setSubmitting(true);

      const parsed = parseCsvData(csvText);
      const res = await adminService.bulkImportUsers({
        students: parsed,
        defaultPassword,
      });

      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setError('');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
        Bulk Onboard Students via CSV
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Quickly enroll an entire class or batch. You can paste CSV data directly or upload a <code>.csv</code> file.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{error}</Typography>
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Import Completed! {result.importedCount} of {result.totalSubmitted} students successfully registered.
            </Typography>
            {result.skippedCount > 0 && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {result.skippedCount} students skipped (already registered): {result.skippedEmails.join(', ')}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Initial password for new accounts: <strong>{result.defaultPassword}</strong>
            </Typography>
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleDownloadSample}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Download CSV Template
          </Button>

          <Button
            variant="outlined"
            component="label"
            size="small"
            startIcon={<FileUploadRoundedIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Upload .CSV File
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFileUpload} />
          </Button>

          <Box sx={{ flex: 1 }} />

          <TextField
            size="small"
            label="Default Password"
            value={defaultPassword}
            onChange={(e) => setDefaultPassword(e.target.value)}
            sx={{ width: 190 }}
          />
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
          Accepted College Branches:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5, mb: 2 }}>
          {COLLEGE_BRANCHES.map((b) => (
            <Chip key={b} label={b} size="small" sx={{ fontSize: '0.72rem' }} />
          ))}
        </Stack>

        <TextField
          fullWidth
          multiline
          rows={10}
          placeholder={`Paste CSV content here...\n\nExample:\n${SAMPLE_CSV}`}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          InputProps={{
            sx: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !csvText.trim()}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <FileUploadRoundedIcon />}
          sx={{
            bgcolor: '#F59E0B',
            '&:hover': { bgcolor: '#D97706' },
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
          }}
        >
          {submitting ? 'Importing...' : 'Enroll Students'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportModal;
