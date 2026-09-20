import { useEffect, useState } from 'react';
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
  Skeleton,
  Tabs,
  Tab,
  MenuItem,
  TextField,
  Chip,
  Button,
} from '@mui/material';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import leaderboardService from '@/services/leaderboardService';
import contestService from '@/services/contestService';
import quizService from '@/services/quizService';

const RANK_CONFIG = {
  1: { color: '#B45309', bgcolor: '#FEF3C7', border: '1px solid #FDE68A', label: '1' },
  2: { color: '#334155', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', label: '2' },
  3: { color: '#9A3412', bgcolor: '#FFEDD5', border: '1px solid #FED7AA', label: '3' },
};

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('GLOBAL');

  // Global Standings
  const [globalEntries, setGlobalEntries] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  // Contests
  const [contests, setContests] = useState([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [contestStandings, setContestStandings] = useState([]);
  const [loadingContest, setLoadingContest] = useState(false);

  // Quizzes / Tests
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizStandings, setQuizStandings] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    // 1. Fetch Global Standings
    leaderboardService
      .getLeaderboard()
      .then((res) => {
        const raw = res.data || [];
        const sorted = [...raw].sort(
          (a, b) => b.score - a.score || b.solved - a.solved || (a.totalRuntimeMs || 0) - (b.totalRuntimeMs || 0)
        );
        const ranked = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
        setGlobalEntries(ranked);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load leaderboard.'))
      .finally(() => setLoadingGlobal(false));

    // 2. Fetch Contests List
    contestService
      .list()
      .then((res) => {
        const list = res.data || [];
        setContests(list);
        if (list.length > 0) {
          setSelectedContestId(list[0].id);
        }
      })
      .catch(() => {});

    // 3. Fetch Quizzes List
    quizService
      .list()
      .then((res) => {
        const list = res.data || [];
        setQuizzes(list);
        if (list.length > 0) {
          setSelectedQuizId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch selected contest leaderboard
  useEffect(() => {
    if (selectedContestId && activeTab === 'CONTESTS') {
      setLoadingContest(true);
      contestService
        .getLeaderboard(selectedContestId)
        .then((res) => {
          setContestStandings(res.data?.standings || []);
        })
        .catch(() => setContestStandings([]))
        .finally(() => setLoadingContest(false));
    }
  }, [selectedContestId, activeTab]);

  // Fetch selected quiz leaderboard
  useEffect(() => {
    if (selectedQuizId && activeTab === 'QUIZZES') {
      setLoadingQuiz(true);
      quizService
        .getLeaderboard(selectedQuizId)
        .then((res) => {
          setQuizStandings(res.data?.standings || []);
        })
        .catch(() => setQuizStandings([]))
        .finally(() => setLoadingQuiz(false));
    }
  }, [selectedQuizId, activeTab]);

  const handleExportCSV = () => {
    let header = [];
    let rows = [];
    let filename = 'leaderboard.csv';

    if (activeTab === 'GLOBAL') {
      header = ['Rank', 'Name', 'Institution', 'Solved', 'Score', 'Total Runtime (ms)'];
      rows = globalEntries.map((r) => [
        r.rank,
        `"${r.name || ''}"`,
        `"${r.college || ''}"`,
        r.solved,
        r.score,
        r.totalRuntimeMs || 0,
      ]);
      filename = 'global_hall_of_fame.csv';
    } else if (activeTab === 'CONTESTS') {
      header = ['Rank', 'Name', 'Roll ID', 'Branch', 'Problems Solved', 'Score'];
      rows = contestStandings.map((r) => [
        r.rank,
        `"${r.name || ''}"`,
        `"${r.collegeId || ''}"`,
        `"${r.branch || ''}"`,
        r.problemsSolved,
        r.score,
      ]);
      const selContest = contests.find((c) => c.id === selectedContestId);
      filename = `${(selContest?.title || 'contest').replace(/\s+/g, '_')}_leaderboard.csv`;
    } else if (activeTab === 'QUIZZES') {
      header = ['Rank', 'Name', 'Roll ID', 'Branch', 'Score', 'Total Marks', 'Percentage'];
      rows = quizStandings.map((r) => [
        r.rank,
        `"${r.name || ''}"`,
        `"${r.collegeId || ''}"`,
        `"${r.branch || ''}"`,
        r.score,
        r.totalMarks,
        `${r.percentage}%`,
      ]);
      const selQuiz = quizzes.find((q) => q.id === selectedQuizId);
      filename = `${(selQuiz?.title || 'test').replace(/\s+/g, '_')}_leaderboard.csv`;
    }

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, fontSize: '1.65rem' }}>
            Leaderboards & Standings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Browse live rankings across the global platform, individual contests, or specific class tests.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#0F172A' }}
          >
            Export Standings (.CSV)
          </Button>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ px: 1.5, py: 0.75, bgcolor: '#DCFCE7', borderRadius: 2, border: '1px solid #BBF7D0' }}
          >
            <CircleRoundedIcon sx={{ fontSize: 9, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803D' }}>
              Live Standings
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab
            value="GLOBAL"
            icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Global Platform Standings"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
          <Tab
            value="CONTESTS"
            icon={<EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Contest Leaderboards"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
          <Tab
            value="QUIZZES"
            icon={<QuizRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Test Leaderboards"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          />
        </Tabs>
      </Paper>

      {/* TAB 1: Global Standings */}
      {activeTab === 'GLOBAL' && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell width={80} sx={{ fontWeight: 700, pl: 3 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Participant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Solved</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Runtime</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Total Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingGlobal ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton height={32} /></TableCell>
                  </TableRow>
                ))
              ) : globalEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#64748B' }}>
                    No leaderboard standings yet. Be the first to solve a problem!
                  </TableCell>
                </TableRow>
              ) : (
                globalEntries.map((r) => {
                  const rankConf = RANK_CONFIG[r.rank];
                  return (
                    <TableRow key={r.userId || r.rank} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.75 } }}>
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
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* TAB 2: Specific Contest Leaderboard */}
      {activeTab === 'CONTESTS' && (
        <Box>
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                Select Contest:
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedContestId}
                onChange={(e) => setSelectedContestId(e.target.value)}
              >
                {contests.length === 0 ? (
                  <MenuItem value="">No contests available</MenuItem>
                ) : (
                  contests.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.title} ({c.status || 'Active'})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell width={80} sx={{ fontWeight: 700, pl: 3 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Roll / College ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Problems Solved</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Contest Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingContest ? (
                  [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : contestStandings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No submissions or participant rankings recorded for this contest yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  contestStandings.map((s) => (
                    <TableRow key={s.userId} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.75 } }}>
                      <TableCell align="center" sx={{ pl: 3 }}>
                        {s.rank === 1 ? (
                          <Chip label="#1 🥇" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800 }} />
                        ) : s.rank === 2 ? (
                          <Chip label="#2 🥈" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                        ) : s.rank === 3 ? (
                          <Chip label="#3 🥉" size="small" sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 800 }} />
                        ) : (
                          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'text.secondary' }}>
                            #{s.rank}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.collegeId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.branch || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10B981' }}>
                          {s.problemsSolved}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#D97706' }}>
                          {s.score} pts
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {/* TAB 3: Specific Test Leaderboard */}
      {activeTab === 'QUIZZES' && (
        <Box>
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                Select Test / Assessment:
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
              >
                {quizzes.length === 0 ? (
                  <MenuItem value="">No tests available</MenuItem>
                ) : (
                  quizzes.map((q) => (
                    <MenuItem key={q.id} value={q.id}>
                      {q.title} ({q.status || 'Active'})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell width={80} sx={{ fontWeight: 700, pl: 3 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Roll / College ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Marks</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingQuiz ? (
                  [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : quizStandings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No student attempts recorded for this test yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  quizStandings.map((s) => (
                    <TableRow key={s.userId} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.75 } }}>
                      <TableCell align="center" sx={{ pl: 3 }}>
                        {s.rank === 1 ? (
                          <Chip label="#1 🥇" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800 }} />
                        ) : s.rank === 2 ? (
                          <Chip label="#2 🥈" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                        ) : s.rank === 3 ? (
                          <Chip label="#3 🥉" size="small" sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 800 }} />
                        ) : (
                          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'text.secondary' }}>
                            #{s.rank}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.collegeId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.branch || '—'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#7C5CFF' }}>
                          {s.score} / {s.totalMarks}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Chip
                          label={`${s.percentage}%`}
                          size="small"
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                            bgcolor: s.percentage >= 75 ? 'rgba(16, 185, 129, 0.12)' : s.percentage >= 40 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: s.percentage >= 75 ? '#10B981' : s.percentage >= 40 ? '#D97706' : '#EF4444',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LeaderboardPage;
