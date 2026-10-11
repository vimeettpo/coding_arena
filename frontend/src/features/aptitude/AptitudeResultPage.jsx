import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import aptitudeService from '@/services/aptitudeService';
import { LETTERS, accuracyColor, categoryUi, difficultyUi, formatDuration, getErrorMessage } from './aptitudeUi';

const verdictFor = (accuracy) => {
  if (accuracy >= 80) return 'Excellent work!';
  if (accuracy >= 60) return 'Good job — keep practising.';
  if (accuracy >= 40) return "You're getting there.";
  return 'Needs more practice — review the explanations below.';
};

const SummaryStat = ({ label, value, color, bg }) => (
  <Box sx={{ flex: 1, minWidth: 110, p: 1.5, borderRadius: 2.5, bgcolor: bg, textAlign: 'center' }}>
    <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color, lineHeight: 1.2 }}>{value}</Typography>
    <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
      {label}
    </Typography>
  </Box>
);

const STATUS_CHIP = {
  correct: { label: 'Correct', color: '#15803D', bg: '#DCFCE7', Icon: CheckCircleRoundedIcon },
  wrong: { label: 'Wrong', color: '#B91C1C', bg: '#FEE2E2', Icon: CancelRoundedIcon },
  skipped: { label: 'Skipped', color: '#475569', bg: '#F1F5F9', Icon: RemoveCircleOutlineRoundedIcon },
};

const statusOf = (item) => {
  if (item.selectedIndex === null || item.selectedIndex === undefined) return 'skipped';
  return item.isCorrect ? 'correct' : 'wrong';
};

const ReviewCard = ({ item }) => {
  const status = statusOf(item);
  const chip = STATUS_CHIP[status];
  const dui = difficultyUi(item.difficulty);

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography sx={{ fontWeight: 800 }}>Q{item.number}</Typography>
          <Chip size="small" variant="outlined" label={item.topic} sx={{ fontWeight: 600 }} />
          <Chip size="small" label={dui.label} sx={{ bgcolor: dui.bg, color: dui.color, fontWeight: 700 }} />
        </Stack>
        <Chip size="small" icon={<chip.Icon />} label={chip.label} sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700, '& .MuiChip-icon': { color: 'inherit' } }} />
      </Stack>

      <Typography sx={{ lineHeight: 1.7, whiteSpace: 'pre-line', color: '#0F172A', mb: 2 }}>{item.question}</Typography>

      <Stack spacing={1}>
        {item.options.map((option, index) => {
          const isCorrectOption = index === item.correctIndex;
          const isSelected = index === item.selectedIndex;
          let border = '#E2E8F0';
          let bg = '#FFFFFF';
          let tag = null;
          if (isCorrectOption) {
            border = '#86EFAC';
            bg = '#F0FDF4';
            tag = isSelected ? 'Your answer · Correct' : 'Correct answer';
          } else if (isSelected) {
            border = '#FCA5A5';
            bg = '#FEF2F2';
            tag = 'Your answer';
          }
          return (
            <Box
              key={index}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, border: '1.5px solid', borderColor: border, bgcolor: bg }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  bgcolor: isCorrectOption ? '#22C55E' : isSelected ? '#EF4444' : '#F1F5F9',
                  color: isCorrectOption || isSelected ? '#FFFFFF' : '#475569',
                }}
              >
                {LETTERS[index]}
              </Box>
              <Typography variant="body2" sx={{ flex: 1, color: '#0F172A' }}>
                {option}
              </Typography>
              {tag && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: isCorrectOption ? '#15803D' : '#B91C1C', whiteSpace: 'nowrap' }}>
                  {tag}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      {item.explanation && (
        <Box sx={{ mt: 2, p: 1.75, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: 1.25 }}>
          <LightbulbRoundedIcon sx={{ color: '#D97706', fontSize: 20, mt: 0.25 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ color: '#451A03', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {item.explanation}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

const AptitudeResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aptitudeService
      .getResult(id)
      .then((res) => {
        if (!cancelled) setResult(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        // Not submitted yet -> the test page will either resume it or explain that it expired.
        if (err?.response?.status === 400) {
          navigate(`/aptitude/test/${id}`, { replace: true });
          return;
        }
        setError(getErrorMessage(err, 'Could not load this result.'));
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const counts = useMemo(() => {
    const c = { all: 0, correct: 0, wrong: 0, skipped: 0 };
    (result?.review || []).forEach((item) => {
      c.all += 1;
      c[statusOf(item)] += 1;
    });
    return c;
  }, [result]);

  const visible = useMemo(
    () => (result?.review || []).filter((item) => filter === 'all' || statusOf(item) === filter),
    [result, filter]
  );

  const practiceAgain = async () => {
    setRestarting(true);
    setRestartError(null);
    try {
      const res = await aptitudeService.startTest({
        category: result.category,
        difficulty: result.difficulty,
        count: Math.min(Math.max(result.totalMarks, 5), 30),
        negativeMarking: result.negativeMarking,
      });
      navigate(`/aptitude/test/${res.data.attemptId}`);
    } catch (err) {
      setRestartError(getErrorMessage(err, 'Could not start a new test.'));
      setRestarting(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/aptitude')} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Back to Aptitude
        </Button>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  const cui = categoryUi(result.category);
  const acc = accuracyColor(result.accuracy);

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/aptitude')} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', mb: 1 }}>
        Back to Aptitude
      </Button>

      {/* ── summary ── */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, mb: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 3, sm: 4 } }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
            <CircularProgress variant="determinate" value={100} size={132} thickness={4} sx={{ color: '#F1F5F9', position: 'absolute' }} />
            <CircularProgress variant="determinate" value={result.accuracy} size={132} thickness={4} sx={{ color: acc.color }} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{result.accuracy}%</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  accuracy
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Chip size="small" label={cui.label} sx={{ bgcolor: cui.bg, color: cui.color, fontWeight: 700 }} />
              {result.difficulty !== 'ANY' && (
                <Chip size="small" label={difficultyUi(result.difficulty).label} sx={{ bgcolor: difficultyUi(result.difficulty).bg, color: difficultyUi(result.difficulty).color, fontWeight: 700 }} />
              )}
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.7rem' }}>
              {result.score} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>/ {result.totalMarks}</Box>
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              {verdictFor(result.accuracy)}
              {result.negativeMarking && ` (−${result.negativeMark} per wrong answer applied)`}
            </Typography>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <SummaryStat label="Correct" value={result.correct} color="#15803D" bg="#F0FDF4" />
              <SummaryStat label="Wrong" value={result.incorrect} color="#B91C1C" bg="#FEF2F2" />
              <SummaryStat label="Skipped" value={result.unanswered} color="#475569" bg="#F1F5F9" />
              <SummaryStat label={`of ${formatDuration(result.durationSeconds)}`} value={formatDuration(result.timeTakenSeconds)} color="#6D28D9" bg="#F5F3FF" />
            </Stack>
          </Box>
        </Box>

        {result.late && (
          <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
            This test was submitted after the time limit.
          </Alert>
        )}
        {restartError && (
          <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>
            {restartError}
          </Alert>
        )}

        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<ReplayRoundedIcon />} onClick={practiceAgain} disabled={restarting} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {restarting ? 'Starting…' : 'Practice again'}
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/aptitude')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            All categories
          </Button>
        </Stack>
      </Paper>

      {/* ── topic breakdown ── */}
      {result.topicBreakdown.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800, mb: 2 }}>
            Topic breakdown
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 4, rowGap: 2 }}>
            {result.topicBreakdown.map((t) => {
              const c = accuracyColor(t.accuracy);
              return (
                <Box key={t.topic}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t.topic}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {t.correct}/{t.total}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={t.accuracy}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: c.color, borderRadius: 3 } }}
                  />
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* ── review ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800 }}>
          Review answers
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(_, value) => value && setFilter(value)}
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5 } }}
        >
          <ToggleButton value="all">All ({counts.all})</ToggleButton>
          <ToggleButton value="correct">Correct ({counts.correct})</ToggleButton>
          <ToggleButton value="wrong">Wrong ({counts.wrong})</ToggleButton>
          <ToggleButton value="skipped">Skipped ({counts.skipped})</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={2} sx={{ pb: 4 }}>
        {visible.length > 0 ? (
          visible.map((item) => <ReviewCard key={item.id} item={item} />)
        ) : (
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, textAlign: 'center', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography sx={{ color: 'text.secondary' }}>No questions in this filter.</Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default AptitudeResultPage;
