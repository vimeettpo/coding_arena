import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar, Skeleton } from '@mui/material';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import leaderboardService from '@/services/leaderboardService';

const RANK_CONFIG = {
  1: { color: '#B45309', bgcolor: '#FEF3C7', border: '1px solid #FDE68A', label: '1' },
  2: { color: '#334155', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', label: '2' },
  3: { color: '#9A3412', bgcolor: '#FFEDD5', border: '1px solid #FED7AA', label: '3' },
};

const LeaderboardPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    leaderboardService
      .getLeaderboard()
      .then((res) => {
        const raw = res.data || [];
        const sorted = [...raw].sort(
          (a, b) => (b.score - a.score) || (b.solved - a.solved) || ((a.totalRuntimeMs || 0) - (b.totalRuntimeMs || 0))
        );
        const ranked = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
        setEntries(ranked);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            Global Leaderboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Ranked dynamically by total marks secured, problems solved, and minimum runtime.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.75, py: 0.75, bgcolor: '#DCFCE7', borderRadius: 2, border: '1px solid #BBF7D0' }}>
          <CircleRoundedIcon sx={{ fontSize: 9, color: '#16A34A' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803D' }}>
            Live Standings
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ mt: 3 }}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : loading ? (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 1.5 }} />
              ))}
            </Stack>
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell width={80} sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75, pl: 3 }}>
                    Rank
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75 }}>
                    Participant
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75 }}>
                    Institution
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75 }}>
                    Solved
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75 }}>
                    Runtime
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', py: 1.75, pr: 3 }}>
                    Total Score
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((r) => {
                    const rankConf = RANK_CONFIG[r.rank];
                    return (
                      <TableRow
                        key={r.userId || r.rank}
                        hover
                        sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: '#F8FAFC !important' },
                          '& td': { borderBottom: '1px solid #F1F5F9', py: 1.75 },
                        }}
                      >
                        <TableCell sx={{ pl: 3 }}>
                          {rankConf ? (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8125rem',
                                fontFamily: "'JetBrains Mono', monospace",
                                ...rankConf,
                              }}
                            >
                              {r.rank}
                            </Box>
                          ) : (
                            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#64748B', pl: 1 }}>
                              #{r.rank}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                bgcolor: r.rank === 1 ? '#FEF3C7' : '#F1F5F9',
                                color: r.rank === 1 ? '#B45309' : '#475569',
                                border: '1px solid',
                                borderColor: r.rank === 1 ? '#FDE68A' : '#E2E8F0',
                              }}
                            >
                              {r.name ? r.name[0].toUpperCase() : 'U'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                              {r.name || 'Anonymous User'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {r.college || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            {r.solved}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#64748B', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>
                          {r.totalRuntimeMs ? `${r.totalRuntimeMs} ms` : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#D97706', fontSize: '0.9375rem' }}>
                            {r.score}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#64748B' }}>
                      No leaderboard standings yet. Be the first to solve a problem!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default LeaderboardPage;
