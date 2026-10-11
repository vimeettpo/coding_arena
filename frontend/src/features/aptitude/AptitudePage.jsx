import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StatCard from '@/components/common/StatCard';
import aptitudeService from '@/services/aptitudeService';
import {
  CATEGORY_KEYS,
  accuracyColor,
  categoryUi,
  difficultyUi,
  formatClock,
  formatDate,
  formatDuration,
  getErrorMessage,
} from './aptitudeUi';

const COUNT_OPTIONS = [5, 10, 15, 20, 30];

// ───────────────────────── start dialog ─────────────────────────

const StartDialog = ({ category: initialCategory, overview, onClose }) => {
  const navigate = useNavigate();
  const limits = overview.limits;
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState('ANY');
  const [count, setCount] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const availableFor = () => {
    if (category === 'MIXED') {
      if (difficulty === 'ANY') return overview.mixedAvailable;
      return overview.categories.reduce((sum, c) => sum + (c.available[difficulty] || 0), 0);
    }
    const cat = overview.categories.find((c) => c.key === category);
    if (!cat) return 0;
    return difficulty === 'ANY' ? cat.available.total : cat.available[difficulty] || 0;
  };

  const available = availableFor();
  const canStart = available >= limits.minQuestions;
  const questionCount = Math.min(count, available);
  const minutes = Math.ceil((questionCount * limits.secondsPerQuestion) / 60);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await aptitudeService.startTest({ category, difficulty, count, negativeMarking });
      navigate(`/aptitude/test/${res.data.attemptId}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the test.'));
      setStarting(false);
    }
  };

  return (
    <Dialog open onClose={starting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Start a practice test</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField select size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth>
            {[...CATEGORY_KEYS, 'MIXED'].map((key) => (
              <MenuItem key={key} value={key}>
                {categoryUi(key).label}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.75 }}>
              Difficulty
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={difficulty}
              onChange={(_, value) => value && setDifficulty(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}
            >
              <ToggleButton value="ANY">Any</ToggleButton>
              <ToggleButton value="EASY">Easy</ToggleButton>
              <ToggleButton value="MEDIUM">Medium</ToggleButton>
              <ToggleButton value="HARD">Hard</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField select size="small" label="Number of questions" value={count} onChange={(e) => setCount(Number(e.target.value))} fullWidth>
            {COUNT_OPTIONS.filter((n) => n >= limits.minQuestions && n <= limits.maxQuestions).map((n) => (
              <MenuItem key={n} value={n}>
                {n} questions
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={<Switch checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Negative marking
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  −{limits.negativeMark} for every wrong answer (score never goes below 0)
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0, '& .MuiSwitch-root': { mt: 0.25, mr: 1 } }}
          />

          {canStart ? (
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {questionCount} questions
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TimerRoundedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {minutes} min
                  </Typography>
                </Stack>
                {questionCount < count && (
                  <Typography variant="caption" sx={{ color: '#B45309' }}>
                    Only {available} available for this selection
                  </Typography>
                )}
              </Stack>
            </Paper>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Only {available} question{available === 1 ? '' : 's'} available for this selection (minimum {limits.minQuestions}). Try a
              different difficulty or category.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={starting} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<PlayArrowRoundedIcon />}
          onClick={handleStart}
          disabled={!canStart || starting}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {starting ? 'Starting…' : 'Start test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ───────────────────────── small pieces ─────────────────────────

const Section = ({ title, subtitle, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
        {subtitle}
      </Typography>
    )}
    {!subtitle && <Box sx={{ mb: 1.5 }} />}
    {children}
  </Box>
);

const CategoryCard = ({ cat, onStart }) => {
  const ui = categoryUi(cat.key);
  const Icon = ui.icon;
  const disabled = cat.available.total === 0;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)', borderColor: '#CBD5E1' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: ui.bg, color: ui.color, display: 'grid', placeItems: 'center' }}>
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{cat.label}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {cat.available.total} questions
          </Typography>
        </Box>
      </Stack>

      <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6, flex: 1 }}>
        {cat.description}
      </Typography>

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {['EASY', 'MEDIUM', 'HARD'].map((d) => {
          const dui = difficultyUi(d);
          return (
            <Chip
              key={d}
              size="small"
              label={`${dui.label} ${cat.available[d] || 0}`}
              sx={{ bgcolor: dui.bg, color: dui.color, fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          );
        })}
      </Stack>

      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {cat.questionsAnswered > 0 ? 'Your accuracy' : 'Not attempted yet'}
          </Typography>
          {cat.questionsAnswered > 0 && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A' }}>
              {cat.accuracy}%
            </Typography>
          )}
        </Stack>
        <LinearProgress
          variant="determinate"
          value={cat.questionsAnswered > 0 ? cat.accuracy : 0}
          sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: ui.color, borderRadius: 3 } }}
        />
      </Box>

      <Button
        fullWidth
        variant="contained"
        startIcon={<PlayArrowRoundedIcon />}
        disabled={disabled}
        onClick={() => onStart(cat.key)}
        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1 }}
      >
        Start practice
      </Button>
    </Paper>
  );
};

const MixedCard = ({ total, onStart }) => {
  const ui = categoryUi('MIXED');
  const Icon = ui.icon;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px dashed #86EFAC',
        bgcolor: '#F0FDF4',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: ui.bg, color: ui.color, display: 'grid', placeItems: 'center' }}>
          <Icon />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>Mixed Practice</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {total} questions
          </Typography>
        </Box>
      </Stack>
      <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, flex: 1 }}>
        A random blend of quantitative, logical and verbal questions — the closest thing to a real placement aptitude round.
      </Typography>
      <Button
        fullWidth
        variant="outlined"
        color="success"
        startIcon={<PlayArrowRoundedIcon />}
        disabled={total === 0}
        onClick={() => onStart('MIXED')}
        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1, bgcolor: '#FFFFFF' }}
      >
        Start mixed test
      </Button>
    </Paper>
  );
};

// ───────────────────────── page ─────────────────────────

const AptitudePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [startCategory, setStartCategory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aptitudeService
      .overview()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load aptitude practice.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, fontSize: '1.6rem' }}>
          Aptitude
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Timed practice for quantitative, logical and verbal rounds — graded instantly, with a worked explanation for every question.
        </Typography>
      </Box>

      {loading && (
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={112} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        </Stack>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && !error && data && (
        <>
          {data.activeAttempt && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#FFFBEB',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TimerRoundedIcon sx={{ color: '#D97706' }} />
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>You have a test in progress</Typography>
                  <Typography variant="body2" sx={{ color: '#92400E' }}>
                    {categoryUi(data.activeAttempt.category).label} · {data.activeAttempt.questionCount} questions ·{' '}
                    {formatClock(data.activeAttempt.remainingSeconds)} left when this page loaded
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="contained"
                startIcon={<PlayArrowRoundedIcon />}
                onClick={() => navigate(`/aptitude/test/${data.activeAttempt.id}`)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                Resume test
              </Button>
            </Paper>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
            <StatCard label="Tests taken" value={data.stats.testsTaken} sublabel="Completed practice tests" icon={QuizRoundedIcon} accent="#7C5CFF" />
            <StatCard
              label="Accuracy"
              value={data.stats.questionsAnswered > 0 ? `${data.stats.accuracy}%` : '—'}
              sublabel="Across all questions"
              icon={TrackChangesRoundedIcon}
              accent="#F59E0B"
            />
            <StatCard
              label="Questions"
              value={data.stats.questionsAnswered}
              sublabel="Practised so far"
              icon={CheckCircleRoundedIcon}
              accent="#10B981"
            />
            <StatCard
              label="Best score"
              value={data.stats.testsTaken > 0 ? `${data.stats.bestScorePercent}%` : '—'}
              sublabel={data.stats.testsTaken > 0 ? `Average ${data.stats.averageScorePercent}%` : 'Take a test to set one'}
              icon={EmojiEventsRoundedIcon}
              accent="#EF4444"
            />
          </Box>

          <Section title="Practice by category" subtitle="Pick a section, choose a difficulty and start a timed test.">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
              {data.categories.map((cat) => (
                <CategoryCard key={cat.key} cat={cat} onStart={setStartCategory} />
              ))}
              <MixedCard total={data.mixedAvailable} onStart={setStartCategory} />
            </Box>
          </Section>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                Focus areas
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Topics where your accuracy is below 70%.
              </Typography>
              {data.focusAreas.length > 0 ? (
                <Stack spacing={2}>
                  {data.focusAreas.map((t) => (
                    <Box key={t.topic}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t.topic}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {t.accuracy}% · {t.total} Qs
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={t.accuracy}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#EF4444', borderRadius: 3 } }}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  {data.stats.testsTaken === 0
                    ? "Take a few tests and we'll point out the topics that need more practice."
                    : 'Nothing to flag — every topic you have practised is at 70% or above. Nice!'}
                </Typography>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', mb: 2 }}>
                Recent tests
              </Typography>
              {data.recent.length > 0 ? (
                <Stack spacing={1}>
                  {data.recent.map((t) => {
                    const cui = categoryUi(t.category);
                    const dui = difficultyUi(t.difficulty);
                    const acc = accuracyColor(t.accuracy);
                    return (
                      <Box
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/aptitude/result/${t.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/aptitude/result/${t.id}`);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          outline: 'none',
                          '&:hover, &:focus-visible': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: cui.color }}>
                              {cui.short}
                            </Typography>
                            <Chip size="small" label={dui.label} sx={{ bgcolor: dui.bg, color: dui.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                          </Stack>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatDate(t.submittedAt)} · {formatDuration(t.timeTakenSeconds)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {t.score} / {t.totalMarks}
                          </Typography>
                          <Chip size="small" label={`${t.accuracy}%`} sx={{ bgcolor: acc.bg, color: acc.color, fontWeight: 700, minWidth: 52 }} />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  No tests yet. Start your first practice test above!
                </Typography>
              )}
            </Paper>
          </Box>

          {startCategory && <StartDialog category={startCategory} overview={data} onClose={() => setStartCategory(null)} />}
        </>
      )}
    </Box>
  );
};

export default AptitudePage;
