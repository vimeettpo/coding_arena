import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import problemService from '@/services/problemService';
import { PROBLEMS } from './mockProblems';

const DIFFICULTY_STYLES = {
  Easy: { color: '#15803D', bgcolor: '#DCFCE7', border: '1px solid #BBF7D0' },
  Medium: { color: '#B45309', bgcolor: '#FEF3C7', border: '1px solid #FDE68A' },
  Hard: { color: '#B91C1C', bgcolor: '#FEE2E2', border: '1px solid #FECACA' },
};

const ProblemsListPage = () => {
  const [problems, setProblems] = useState(PROBLEMS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    problemService
      .list(difficulty !== 'ALL' ? { difficulty } : {})
      .then((res) => {
        const content = res.data?.content || res.data || [];
        if (content.length > 0) {
          setProblems(content);
        } else {
          setProblems(PROBLEMS);
        }
      })
      .catch(() => {
        setProblems(PROBLEMS);
      })
      .finally(() => setLoading(false));
  }, [difficulty]);

  const filtered = useMemo(
    () =>
      problems.filter((p) => {
        const matchesQuery = p.title ? p.title.toLowerCase().includes(query.toLowerCase()) : true;
        return matchesQuery;
      }),
    [query, problems]
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            Code Arena
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {loading ? 'Loading coding problems...' : `${problems.length} coding problem${problems.length === 1 ? '' : 's'} available to practice and conquer.`}
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/compiler"
          variant="contained"
          color="primary"
          startIcon={<CodeRoundedIcon />}
          sx={{ fontWeight: 600, textTransform: 'none', px: 2.5, py: 1 }}
        >
          Open Online Compiler
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search coding problems by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          size="small"
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={difficulty}
          onChange={(_, v) => v && setDifficulty(v)}
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 2,
            p: 0.5,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 2,
              py: 0.5,
              border: 'none',
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: '#64748B',
              '&.Mui-selected': {
                bgcolor: 'rgba(245, 158, 11, 0.14)',
                color: '#D97706',
                '&:hover': {
                  bgcolor: 'rgba(245, 158, 11, 0.2)',
                },
              },
            },
          }}
        >
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="EASY">Easy</ToggleButton>
          <ToggleButton value="MEDIUM">Medium</ToggleButton>
          <ToggleButton value="HARD">Hard</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : loading ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={42} sx={{ borderRadius: 1.5 }} />
            ))}
          </Stack>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell width={48} sx={{ borderBottom: '1px solid #E2E8F0', py: 1.5 }} />
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>
                  Problem
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>
                  Difficulty
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>
                  Tags
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.5 }}>
                  Acceptance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const diffLabel = p.difficulty ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1).toLowerCase() : 'Easy';
                  const dStyle = DIFFICULTY_STYLES[diffLabel] || DIFFICULTY_STYLES.Easy;

                  return (
                    <TableRow
                      key={p.slug || p.id}
                      component={Link}
                      to={`/problems/${p.slug}`}
                      hover
                      sx={{
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          bgcolor: '#F8FAFC !important',
                        },
                        '& td': {
                          borderBottom: '1px solid #F1F5F9',
                          py: 1.75,
                        },
                      }}
                    >
                      <TableCell align="center">
                        {p.solved ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#10B981', display: 'block', margin: 'auto' }} />
                        ) : (
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#CBD5E1', margin: 'auto' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#0F172A', fontWeight: 600, fontSize: '0.9375rem' }}>
                        {p.title}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={diffLabel}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 24,
                            ...dStyle,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ rowGap: 0.5 }}>
                          {(p.tags || []).map((t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{
                                bgcolor: '#F1F5F9',
                                color: '#475569',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                height: 22,
                                borderRadius: 1,
                              }}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#64748B', fontSize: '0.875rem' }}>
                        {p.acceptanceRate ? `${Math.round(p.acceptanceRate)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#64748B' }}>
                    No problems found matching your criteria.
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

export default ProblemsListPage;
