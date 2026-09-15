import { useEffect, useMemo, useState } from 'react';
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
  Skeleton,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import dashboardService from '@/services/dashboardService';

const TrainerStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dashboardService
      .getStudentsList()
      .then((res) => setStudents(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load students list.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = s.name ? s.name.toLowerCase().includes(q) : false;
      const emailMatch = s.email ? s.email.toLowerCase().includes(q) : false;
      const collegeMatch = s.college ? s.college.toLowerCase().includes(q) : false;
      return nameMatch || emailMatch || collegeMatch;
    });
  }, [students, searchQuery]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5, color: '#0F172A', fontWeight: 800 }}>
        Students
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Monitor registered student profiles, problem solving progress, and submission counts.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search student by name, email, or college…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
        />
      </Stack>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : loading ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
            ))}
          </Stack>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#FFFFFF' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>College / Batch</TableCell>
                <TableCell align="center">Email Status</TableCell>
                <TableCell align="center">Problems Solved</TableCell>
                <TableCell align="center">Total Submissions</TableCell>
                <TableCell align="right">Joined Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <TableRow key={s.id} hover sx={{ '& td': { borderColor: 'divider' } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: '0.85rem',
                            bgcolor: 'rgba(245, 158, 11, 0.15)',
                            color: '#D97706',
                            fontWeight: 700,
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          {s.name ? s.name[0] : 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {s.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.college || 'N/A'}</Typography>
                      {s.branch && (
                        <Typography variant="caption" color="text.secondary">
                          {s.branch} {s.year ? `(${s.year})` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {s.emailVerified ? (
                        <Chip
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Verified"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<HourglassEmptyRoundedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Pending"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'success.main' }}>
                        {s.solvedCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        {s.totalSubmissions}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No students registered in the database yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default TrainerStudentsPage;
