import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Skeleton,
} from '@mui/material';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '@/services/quizService';

const QuizAttemptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active attempt state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setLoading(true);
    quizService
      .getDetail(id)
      .then((res) => {
        const quizData = res.data;
        setQuiz(quizData);

        if (quizData.attempted) {
          // Fetch existing attempt results
          return quizService.getResult(id).then((rRes) => setResult(rRes.data));
        } else {
          // Initialize countdown timer
          const nowMs = Date.now();
          const durationMs = (quizData.durationMinutes || 30) * 60 * 1000;
          const endMs = quizData.endTime ? new Date(quizData.endTime).getTime() : nowMs + durationMs;
          const targetMs = Math.min(nowMs + durationMs, endMs);
          const remainingSecs = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
          setTimeLeft(remainingSecs);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load test.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown timer effect
  useEffect(() => {
    if (result || timeLeft === null || quiz?.attempted) return;

    if (timeLeft <= 0) {
      handleFinalSubmit(); // Auto-submit when time expires
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result, quiz]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(optionIndex),
    }));
  };

  const handleFinalSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    quizService
      .submit(id, { answers })
      .then((res) => {
        setResult(res.data);
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to submit test.'))
      .finally(() => setSubmitting(false));
  };

  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/quizzes')} sx={{ mb: 2 }}>
          Back to Tests
        </Button>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // ---- VIEW 1: TEST COMPLETED & SCORE RESULT ----
  if (result) {
    return (
      <Box sx={{ maxWidth: 850, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate('/quizzes')}
          sx={{ mb: 3, color: '#64748B', fontWeight: 600 }}
        >
          Back to Tests
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4.5,
            borderRadius: 3,
            textAlign: 'center',
            mb: 3.5,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 44, color: '#16A34A' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            Assessment Completed!
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B', mb: 3 }}>
            {result.quizTitle}
          </Typography>

          <Stack direction="row" justifyContent="center" spacing={6} sx={{ my: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                YOUR SCORE
              </Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 700, color: '#D97706' }}>
                {result.score} / {result.totalMarks}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                PERCENTAGE
              </Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 700, color: '#0F172A' }}>
                {result.percentage}%
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
          Detailed Answer Breakdown
        </Typography>

        <Stack spacing={2.5}>
          {result.questionResults.map((q, index) => {
            const isAnswerCorrect = Boolean(q.correct || q.isCorrect);
            return (
              <Paper
                key={q.questionId || index}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Q{index + 1}. {q.questionText}
                  </Typography>
                  <Chip
                    size="small"
                    icon={isAnswerCorrect ? <CheckCircleRoundedIcon sx={{ fontSize: '16px !important' }} /> : <CancelRoundedIcon sx={{ fontSize: '16px !important' }} />}
                    label={isAnswerCorrect ? `+${q.pointsEarned} pts` : `0 / ${q.maxPoints} pts`}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      bgcolor: isAnswerCorrect ? '#DCFCE7' : '#FEE2E2',
                      color: isAnswerCorrect ? '#15803D' : '#B91C1C',
                      border: isAnswerCorrect ? '1px solid #BBF7D0' : '1px solid #FECACA',
                    }}
                  />
                </Stack>

                <Stack spacing={1} sx={{ mt: 2 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = q.selectedOptionIndex === oIdx;
                    const isCorrectOpt = q.correctOptionIndex === oIdx;

                    let borderColor = '#E2E8F0';
                    let bgcolor = '#FAFAFA';
                    let textColor = '#475569';

                    if (isCorrectOpt) {
                      borderColor = '#86EFAC';
                      bgcolor = '#F0FDF4';
                      textColor = '#15803D';
                    } else if (isSelected && !isAnswerCorrect) {
                      borderColor = '#FCA5A5';
                      bgcolor = '#FEF2F2';
                      textColor = '#B91C1C';
                    }

                    return (
                      <Box
                        key={oIdx}
                        sx={{
                          p: 1.5,
                          px: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor,
                          bgcolor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: isCorrectOpt || isSelected ? 600 : 500, color: textColor }}>
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </Typography>
                        {isCorrectOpt && (
                          <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700 }}>
                            Correct Answer
                          </Typography>
                        )}
                        {isSelected && !isCorrectOpt && (
                          <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700 }}>
                            Your Selection
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  }

  // ---- VIEW 2: ACTIVE TEST ATTEMPT ----
  const currentQ = quiz.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      {/* Top Header Bar with Timer & Title */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          mb: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.15rem' }}>
              {quiz.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length} ({answeredCount} answered)
            </Typography>
          </Box>
          <Chip
            icon={<TimerRoundedIcon sx={{ fontSize: '18px !important', color: timeLeft < 180 ? '#DC2626 !important' : '#D97706 !important' }} />}
            label={formatTime(timeLeft)}
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: '0.95rem',
              px: 1.5,
              py: 2,
              borderRadius: 2,
              bgcolor: timeLeft < 180 ? '#FEE2E2' : '#FEF3C7',
              color: timeLeft < 180 ? '#B91C1C' : '#92400E',
              border: timeLeft < 180 ? '1px solid #FECACA' : '1px solid #FDE68A',
            }}
          />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            mt: 2.5,
            height: 6,
            borderRadius: 3,
            bgcolor: '#F1F5F9',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#F59E0B',
              borderRadius: 3,
            },
          }}
        />
      </Paper>

      {/* Question Card */}
      {currentQ && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            mb: 3,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.2rem', lineHeight: 1.5 }}>
              Q{currentQuestionIndex + 1}. {currentQ.questionText}
            </Typography>
            <Chip
              size="small"
              label={`${currentQ.points || 1} Pts`}
              sx={{
                bgcolor: '#F1F5F9',
                color: '#475569',
                fontWeight: 600,
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
              }}
            />
          </Stack>

          <FormControl component="fieldset" fullWidth sx={{ mt: 1 }}>
            <RadioGroup
              value={answers[currentQ.id] !== undefined ? answers[currentQ.id] : ''}
              onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
            >
              <Stack spacing={1.5}>
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id] === oIdx;
                  return (
                    <Paper
                      key={oIdx}
                      variant="outlined"
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                      sx={{
                        p: 1.75,
                        px: 2.25,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        borderColor: isSelected ? '#F59E0B' : '#E2E8F0',
                        bgcolor: isSelected ? 'rgba(245, 158, 11, 0.08)' : '#FAFAFA',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                          bgcolor: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#F1F5F9',
                        },
                      }}
                    >
                      <FormControlLabel
                        value={oIdx}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: '#94A3B8',
                              '&.Mui-checked': {
                                color: '#D97706',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0F172A' : '#334155' }}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </Typography>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                  );
                })}
              </Stack>
            </RadioGroup>
          </FormControl>
        </Paper>
      )}

      {/* Footer Navigation Buttons */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
          sx={{
            color: '#64748B',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
          }}
        >
          Previous
        </Button>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3.5,
              py: 1,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
            }}
          >
            Next Question
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={() => setShowConfirm(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3.5,
              py: 1,
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Submit Test
          </Button>
        )}
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>
          Submit Test?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, color: '#334155' }}>
            You have answered <strong>{answeredCount}</strong> out of <strong>{quiz.questions.length}</strong> questions.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Once submitted, your answers will be instantly graded and you cannot make further modifications.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setShowConfirm(false)} sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
            Continue Test
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalSubmit}
            disabled={submitting}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#10B981',
              color: '#FFFFFF',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizAttemptPage;
