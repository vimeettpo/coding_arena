import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import aptitudeService from '@/services/aptitudeService';
import { LETTERS, categoryUi, difficultyUi, formatClock, getErrorMessage } from './aptitudeUi';

const storageKey = (id) => `ca_aptitude_progress_${id}`;

const loadSaved = (id) => {
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearSaved = (id) => {
  try {
    sessionStorage.removeItem(storageKey(id));
  } catch {
    /* storage unavailable — nothing to clear */
  }
};

const PALETTE_STATES = {
  answered: { bg: '#DCFCE7', border: '#86EFAC', color: '#166534' },
  unanswered: { bg: '#F8FAFC', border: '#E2E8F0', color: '#475569' },
};

const AptitudeTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> option index shown on screen
  const [flagged, setFlagged] = useState({}); // questionId -> true
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const deadlineRef = useRef(0);
  const submittingRef = useRef(false);
  const autoSubmitRef = useRef(false);

  // ── load the test ──
  useEffect(() => {
    let cancelled = false;
    aptitudeService
      .getTest(id)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (data.status === 'SUBMITTED') {
          navigate(`/aptitude/result/${id}`, { replace: true });
          return;
        }
        // The server tells us how much time is left; we count down to a fixed deadline
        // so the timer stays accurate even if the tab is throttled in the background.
        deadlineRef.current = Date.now() + data.remainingSeconds * 1000;
        const saved = loadSaved(id);
        if (saved) {
          const validIds = new Set(data.questions.map((q) => q.id));
          const keep = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([qid]) => validIds.has(qid)));
          setAnswers(keep(saved.answers));
          setFlagged(keep(saved.flagged));
          if (Number.isInteger(saved.current) && saved.current >= 0 && saved.current < data.questions.length) {
            setCurrent(saved.current);
          }
        }
        setRemaining(data.remainingSeconds);
        setTest(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load this test.'));
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ── countdown ──
  useEffect(() => {
    if (!test) return undefined;
    const timer = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(timer);
  }, [test]);

  // ── keep answers across an accidental refresh ──
  useEffect(() => {
    if (!test) return;
    try {
      sessionStorage.setItem(storageKey(id), JSON.stringify({ answers, flagged, current }));
    } catch {
      /* storage unavailable — progress just won't survive a refresh */
    }
  }, [id, test, answers, flagged, current]);

  // ── warn before closing the tab mid-test ──
  useEffect(() => {
    if (!test || submitting) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [test, submitting]);

  const submit = useCallback(async () => {
    if (!test || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        answers: test.questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? null })),
      };
      await aptitudeService.submitTest(id, payload);
      clearSaved(id);
      navigate(`/aptitude/result/${id}`, { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setSubmitting(false);
      setConfirmOpen(false);
      setSubmitError(getErrorMessage(err, 'Could not submit your test. Check your connection and try again.'));
    }
  }, [test, answers, id, navigate]);

  // ── auto-submit when the clock hits zero ──
  useEffect(() => {
    if (test && remaining === 0 && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      submit();
    }
  }, [test, remaining, submit]);

  // ───────── states before the test is ready ─────────
  if (loadError) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/aptitude')} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Back to Aptitude
        </Button>
      </Box>
    );
  }

  if (!test) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ───────── derived values ─────────
  const total = test.questions.length;
  const question = test.questions[current];
  const answeredCount = test.questions.filter((q) => answers[q.id] !== undefined).length;
  const flaggedCount = test.questions.filter((q) => flagged[q.id]).length;
  const unansweredCount = total - answeredCount;
  const lowTime = remaining !== null && remaining <= 60;
  const catUi = categoryUi(test.category);
  const diffUi = difficultyUi(question.difficulty);
  const isLast = current === total - 1;

  const selectOption = (index) => setAnswers((prev) => ({ ...prev, [question.id]: index }));
  const clearAnswer = () =>
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
  const toggleFlag = () => setFlagged((prev) => ({ ...prev, [question.id]: !prev[question.id] }));

  return (
    <Box>
      {/* ── top bar ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{catUi.label}</Typography>
          {test.difficulty !== 'ANY' && (
            <Chip size="small" label={difficultyUi(test.difficulty).label} sx={{ bgcolor: difficultyUi(test.difficulty).bg, color: difficultyUi(test.difficulty).color, fontWeight: 700 }} />
          )}
          {test.negativeMarking && (
            <Chip size="small" label={`−${test.negativeMark} per wrong answer`} sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
          )}
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ minWidth: 140, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Answered {answeredCount} / {total}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(answeredCount / total) * 100}
              sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#10B981', borderRadius: 3 } }}
            />
          </Box>
          <Chip
            icon={<TimerRoundedIcon />}
            label={formatClock(remaining ?? 0)}
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: '1rem',
              height: 38,
              px: 0.5,
              bgcolor: lowTime ? '#FEE2E2' : '#F1F5F9',
              color: lowTime ? '#B91C1C' : '#0F172A',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        </Stack>
      </Paper>

      {submitError && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            <Button color="inherit" size="small" onClick={submit}>
              Retry submit
            </Button>
          }
        >
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 2.5, alignItems: 'start' }}>
        {/* ── question ── */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>
                Question {current + 1} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>of {total}</Box>
              </Typography>
              <Chip size="small" label={question.topic} variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip size="small" label={diffUi.label} sx={{ bgcolor: diffUi.bg, color: diffUi.color, fontWeight: 700 }} />
            </Stack>
            <Button
              size="small"
              onClick={toggleFlag}
              startIcon={<FlagRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: flagged[question.id] ? '#B45309' : 'text.secondary',
                bgcolor: flagged[question.id] ? '#FEF3C7' : 'transparent',
                borderRadius: 2,
              }}
            >
              {flagged[question.id] ? 'Marked for review' : 'Mark for review'}
            </Button>
          </Stack>

          <Typography sx={{ fontSize: '1.08rem', lineHeight: 1.75, color: '#0F172A', whiteSpace: 'pre-line', mb: 3 }}>
            {question.question}
          </Typography>

          <Stack spacing={1.25} role="radiogroup" aria-label="Answer options">
            {question.options.map((option, index) => {
              const selected = answers[question.id] === index;
              return (
                <ButtonBase
                  key={`${question.id}-${index}`}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectOption(index)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 1.5,
                    width: '100%',
                    textAlign: 'left',
                    p: 1.5,
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: selected ? '#F59E0B' : '#E2E8F0',
                    bgcolor: selected ? '#FFFBEB' : '#FFFFFF',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: selected ? '#F59E0B' : '#CBD5E1', bgcolor: selected ? '#FFFBEB' : '#F8FAFC' },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      bgcolor: selected ? '#F59E0B' : '#F1F5F9',
                      color: selected ? '#0F172A' : '#475569',
                    }}
                  >
                    {LETTERS[index]}
                  </Box>
                  <Typography sx={{ color: '#0F172A', lineHeight: 1.5 }}>{option}</Typography>
                </ButtonBase>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3.5 }} spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Previous
            </Button>
            <Button onClick={clearAnswer} disabled={answers[question.id] === undefined} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
              Clear answer
            </Button>
            {isLast ? (
              <Button variant="contained" onClick={() => setConfirmOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                Review &amp; submit
              </Button>
            ) : (
              <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => setCurrent((c) => c + 1)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                Next
              </Button>
            )}
          </Stack>
        </Paper>

        {/* ── palette ── */}
        <Paper
          elevation={0}
          sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', position: { md: 'sticky' }, top: { md: 16 } }}
        >
          <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>Questions</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
            {test.questions.map((q, i) => {
              const state = answers[q.id] !== undefined ? PALETTE_STATES.answered : PALETTE_STATES.unanswered;
              const isCurrent = i === current;
              return (
                <ButtonBase
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to question ${i + 1}${flagged[q.id] ? ', marked for review' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  sx={{
                    position: 'relative',
                    height: 38,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    bgcolor: state.bg,
                    color: state.color,
                    border: '2px solid',
                    borderColor: isCurrent ? '#F59E0B' : state.border,
                    boxShadow: isCurrent ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : 'none',
                  }}
                >
                  {i + 1}
                  {flagged[q.id] && (
                    <Box sx={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B', border: '2px solid #FFFFFF' }} />
                  )}
                </ButtonBase>
              );
            })}
          </Box>

          <Stack spacing={0.75} sx={{ mt: 2, color: 'text.secondary' }}>
            <Typography variant="caption">
              <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: 0.5, bgcolor: '#DCFCE7', border: '1px solid #86EFAC', mr: 1 }} />
              Answered ({answeredCount})
            </Typography>
            <Typography variant="caption">
              <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: 0.5, bgcolor: '#F8FAFC', border: '1px solid #CBD5E1', mr: 1 }} />
              Not answered ({unansweredCount})
            </Typography>
            <Typography variant="caption">
              <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B', mr: 1 }} />
              Marked for review ({flaggedCount})
            </Typography>
          </Stack>

          <Stack spacing={1} sx={{ mt: 2.5 }}>
            <Button fullWidth variant="contained" onClick={() => setConfirmOpen(true)} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1 }}>
              Submit test
            </Button>
            <Button fullWidth startIcon={<ExitToAppRoundedIcon />} onClick={() => setExitOpen(true)} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
              Leave for now
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* ── submit confirmation ── */}
      <Dialog open={confirmOpen} onClose={submitting ? undefined : () => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Submit your test?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Stack spacing={0.75}>
              <span>
                You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
              </span>
              {unansweredCount > 0 && (
                <span style={{ color: '#B45309' }}>
                  {unansweredCount} question{unansweredCount === 1 ? ' is' : 's are'} still unanswered.
                </span>
              )}
              {flaggedCount > 0 && (
                <span>
                  {flaggedCount} question{flaggedCount === 1 ? ' is' : 's are'} marked for review.
                </span>
              )}
              <span>You can&apos;t change your answers after submitting.</span>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Keep working
          </Button>
          <Button variant="contained" onClick={submit} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {submitting ? 'Submitting…' : 'Submit now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── leave confirmation ── */}
      <Dialog open={exitOpen} onClose={() => setExitOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Leave this test?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The timer keeps running while you are away. You can resume from the Aptitude page until it reaches zero — after that the test
            expires and can&apos;t be submitted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setExitOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Stay
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/aptitude')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AptitudeTestPage;
