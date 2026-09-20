import { useEffect, useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Grid,
} from '@mui/material';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate } from 'react-router-dom';

import quizService from '@/services/quizService';
import problemService from '@/services/problemService';
import { LANGUAGE_BOILERPLATE, MONACO_LANGUAGE_ID } from '../problems/monacoConfig';

const ALL_LANGUAGES = [
  { key: 'JAVA', label: 'Java', monaco: 'java' },
  { key: 'PYTHON', label: 'Python 3', monaco: 'python' },
  { key: 'CPP', label: 'C++', monaco: 'cpp' },
  { key: 'C', label: 'C', monaco: 'c' },
  { key: 'JAVASCRIPT', label: 'JavaScript', monaco: 'javascript' },
];

const QuizAttemptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Section navigation: 0 = MCQs, 1 = Coding Problems
  const [activeSection, setActiveSection] = useState(0);

  // MCQ state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Coding Problems state
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [codingSolutions, setCodingSolutions] = useState({}); // { [problemId]: { code, language, score, status, output } }
  const [activeLanguage, setActiveLanguage] = useState('JAVA');
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState(null);
  const [runningCode, setRunningCode] = useState(false);

  // Timer & Confirmation state
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

        // Determine default active language based on allowedLanguages
        if (quizData.allowedLanguages && quizData.allowedLanguages.length > 0) {
          setActiveLanguage(quizData.allowedLanguages[0]);
        }

        // Set default section: if no MCQs but coding problems exist, default to Coding
        if ((!quizData.questions || quizData.questions.length === 0) && quizData.codingProblems?.length > 0) {
          setActiveSection(1);
        }

        if (quizData.attempted) {
          return quizService.getResult(id).then((rRes) => setResult(rRes.data));
        } else {
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
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result, quiz]);

  // Filter allowed languages
  const selectableLanguages = useMemo(() => {
    if (!quiz?.allowedLanguages || quiz.allowedLanguages.length === 0) {
      return ALL_LANGUAGES;
    }
    return ALL_LANGUAGES.filter((l) => quiz.allowedLanguages.includes(l.key));
  }, [quiz?.allowedLanguages]);

  // Current coding problem
  const currentCodingProblem = useMemo(() => {
    if (!quiz?.codingProblems || quiz.codingProblems.length === 0) return null;
    return quiz.codingProblems[currentProblemIndex] || quiz.codingProblems[0];
  }, [quiz?.codingProblems, currentProblemIndex]);

  // Current code in editor
  const currentCode = useMemo(() => {
    if (!currentCodingProblem) return '';
    const sol = codingSolutions[currentCodingProblem.problemId];
    if (sol && sol.code) return sol.code;
    return LANGUAGE_BOILERPLATE[activeLanguage] || LANGUAGE_BOILERPLATE['JAVA'] || '';
  }, [codingSolutions, currentCodingProblem, activeLanguage]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(optionIndex),
    }));
  };

  const handleCodeChange = (newCode) => {
    if (!currentCodingProblem) return;
    setCodingSolutions((prev) => ({
      ...prev,
      [currentCodingProblem.problemId]: {
        ...(prev[currentCodingProblem.problemId] || {}),
        code: newCode,
        language: activeLanguage,
      },
    }));
  };

  // Run Code against custom input
  const handleRunCode = async () => {
    if (!currentCodingProblem) return;
    setRunningCode(true);
    setConsoleOutput('Executing code...');

    try {
      const slug = currentCodingProblem.slug;
      let res;
      if (slug) {
        res = await problemService.run(slug, {
          language: activeLanguage,
          code: currentCode,
          customInput,
        });
      } else {
        res = await problemService.compile({
          language: activeLanguage,
          code: currentCode,
          input: customInput,
        });
      }
      const data = res.data || res;
      setConsoleOutput(data.output || data.stdout || data.stderr || 'Code executed successfully (no output).');
    } catch (err) {
      setConsoleOutput(err.response?.data?.message || err.message || 'Execution error.');
    } finally {
      setRunningCode(false);
    }
  };

  // Submit and verify code for current problem
  const handleSaveProblemCode = async () => {
    if (!currentCodingProblem) return;
    setRunningCode(true);
    setConsoleOutput('Validating solution against test cases...');

    try {
      const slug = currentCodingProblem.slug;
      let res;
      if (slug) {
        res = await problemService.submit(slug, {
          language: activeLanguage,
          code: currentCode,
        });
      } else {
        res = await problemService.compile({
          language: activeLanguage,
          code: currentCode,
          input: '',
        });
      }

      const data = res.data || res;
      const isAccepted = data.verdict === 'ACCEPTED' || data.success;
      const points = isAccepted ? (currentCodingProblem.points || 20) : 0;

      setCodingSolutions((prev) => ({
        ...prev,
        [currentCodingProblem.problemId]: {
          problemId: currentCodingProblem.problemId,
          code: currentCode,
          language: activeLanguage,
          score: points,
          status: isAccepted ? 'ACCEPTED' : (data.verdict || 'WRONG_ANSWER'),
        },
      }));

      setConsoleOutput(
        isAccepted
          ? `✓ Accepted! All sample test cases passed (${points}/${currentCodingProblem.points || 20} points awarded).`
          : `✗ Test evaluation: ${data.judgeOutput || data.verdict || 'Wrong Answer or Runtime Error'}`
      );
    } catch (err) {
      setConsoleOutput(err.response?.data?.message || 'Verification error.');
    } finally {
      setRunningCode(false);
    }
  };

  // Final Assessment Submit
  const handleFinalSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    const codingSubmissionsArray = Object.keys(codingSolutions).map((pId) => ({
      problemId: pId,
      code: codingSolutions[pId]?.code || '',
      language: codingSolutions[pId]?.language || activeLanguage,
      score: codingSolutions[pId]?.score || 0,
      status: codingSolutions[pId]?.status || 'SUBMITTED',
    }));

    quizService
      .submit(id, {
        answers,
        codingSubmissions: codingSubmissionsArray,
      })
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
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/quizzes')} sx={{ mb: 2 }}>
          Back to Tests
        </Button>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // ---- VIEW 1: SCORECARD / COMPLETED TEST ----
  if (result) {
    const isPassed = result.percentage >= (quiz?.passingPercentage || 40);
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', pb: 5 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate('/quizzes')}
          sx={{ mb: 2.5, color: '#64748B', fontWeight: 600, textTransform: 'none' }}
        >
          Back to All Tests
        </Button>

        {/* Scorecard Hero */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isPassed ? '#10B981' : '#EF4444',
              mb: 2,
            }}
          >
            {isPassed ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
            ) : (
              <CancelRoundedIcon sx={{ fontSize: 48 }} />
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            {isPassed ? 'Assessment Completed Successfully!' : 'Assessment Concluded'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {result.quizTitle || quiz?.title}
          </Typography>

          {/* Marks Breakdown */}
          <Stack
            direction="row"
            justifyContent="center"
            spacing={{ xs: 2, sm: 4 }}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {result.score} / {result.totalMarks}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                TOTAL SCORE
              </Typography>
            </Box>

            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: isPassed ? '#10B981' : '#EF4444' }}>
                {result.percentage}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                PERCENTAGE
              </Typography>
            </Box>

            {result.mcqScore !== undefined && result.codingScore !== undefined && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#7C5CFF' }}>
                  {result.mcqScore} + {result.codingScore}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  MCQ + CODING
                </Typography>
              </Box>
            )}
          </Stack>

          <Chip
            label={isPassed ? `PASSED (Cutoff: ${quiz?.passingPercentage || 40}%)` : `BELOW CUTOFF (${quiz?.passingPercentage || 40}%)`}
            sx={{
              bgcolor: isPassed ? '#DCFCE7' : '#FEE2E2',
              color: isPassed ? '#15803D' : '#B91C1C',
              fontWeight: 800,
              fontSize: '0.8rem',
            }}
          />
        </Paper>

        {/* Detailed Question Review if available */}
        {result.questionResults && result.questionResults.length > 0 && (
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
              MCQ Questions Review
            </Typography>

            <Stack spacing={2.5}>
              {result.questionResults.map((qr, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    bgcolor: qr.isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {idx + 1}. {qr.questionText}
                    </Typography>
                    <Chip
                      size="small"
                      label={qr.isCorrect ? `+${qr.pointsEarned} Marks` : qr.pointsEarned < 0 ? `${qr.pointsEarned} Marks` : '0 Marks'}
                      sx={{
                        fontWeight: 700,
                        bgcolor: qr.isCorrect ? '#DCFCE7' : '#FEE2E2',
                        color: qr.isCorrect ? '#15803D' : '#B91C1C',
                      }}
                    />
                  </Stack>

                  <Stack spacing={1}>
                    {qr.options?.map((opt, oIdx) => {
                      const isUserChoice = qr.selectedOptionIndex === oIdx;
                      const isCorrectChoice = qr.correctOptionIndex === oIdx;

                      let borderColor = '#E2E8F0';
                      let bgColor = '#FAFAFA';
                      if (isCorrectChoice) {
                        borderColor = '#10B981';
                        bgColor = '#DCFCE7';
                      } else if (isUserChoice && !qr.isCorrect) {
                        borderColor = '#EF4444';
                        bgColor = '#FEE2E2';
                      }

                      return (
                        <Box
                          key={oIdx}
                          sx={{
                            p: 1.25,
                            px: 2,
                            borderRadius: 1.5,
                            border: `1px solid ${borderColor}`,
                            bgcolor: bgColor,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: isUserChoice || isCorrectChoice ? 600 : 400 }}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </Typography>
                          {isCorrectChoice && (
                            <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700 }}>
                              ✓ Correct Answer
                            </Typography>
                          )}
                          {isUserChoice && !isCorrectChoice && (
                            <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700 }}>
                              ✗ Your Choice
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    );
  }

  // ---- VIEW 2: ACTIVE TEST TAKING WORKSPACE ----
  const hasMcqs = quiz?.questions && quiz.questions.length > 0;
  const hasCoding = quiz?.codingProblems && quiz.codingProblems.length > 0;
  const answeredCount = Object.keys(answers).length;
  const currentMcq = hasMcqs ? quiz.questions[currentQuestionIndex] : null;

  return (
    <Box sx={{ maxWidth: activeSection === 1 ? '100%' : 900, mx: 'auto', pb: 6 }}>
      {/* Top Test Navigation Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          position: 'sticky',
          top: 75,
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
              {quiz.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Total: {quiz.totalMarks} Marks
              </Typography>
              {quiz.negativeMarking && (
                <Chip
                  size="small"
                  label={`-${quiz.negativeMarks || 1} Penalty per wrong MCQ`}
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }}
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Timer pill */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 2,
                py: 0.75,
                bgcolor: timeLeft && timeLeft < 300 ? '#FEE2E2' : '#F1F5F9',
                color: timeLeft && timeLeft < 300 ? '#DC2626' : '#0F172A',
                borderRadius: 2,
                border: '1px solid #E2E8F0',
              }}
            >
              <TimerRoundedIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                {formatTime(timeLeft)}
              </Typography>
            </Stack>

            <Button
              variant="contained"
              color="success"
              onClick={() => setShowConfirm(true)}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
                borderRadius: 2,
              }}
            >
              Finish & Submit
            </Button>
          </Stack>
        </Stack>

        {/* Section Navigation Tabs (if both MCQs and Coding exist) */}
        {hasMcqs && hasCoding && (
          <Tabs
            value={activeSection}
            onChange={(_, v) => setActiveSection(v)}
            sx={{
              mt: 2,
              borderTop: '1px solid #F1F5F9',
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                fontWeight: 700,
                textTransform: 'none',
              },
            }}
          >
            <Tab icon={<QuizRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`MCQ Questions (${quiz.questions.length})`} />
            <Tab icon={<CodeRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Coding Problems (${quiz.codingProblems.length})`} />
          </Tabs>
        )}
      </Paper>

      {/* SECTION 1: MCQs */}
      {activeSection === 0 && hasMcqs && (
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          {/* Question Bubbles Navigation */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {quiz.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <Chip
                    key={q.id}
                    label={`Q${idx + 1}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      bgcolor: isCurrent ? '#F59E0B' : isAnswered ? '#DCFCE7' : '#F8FAFC',
                      color: isCurrent ? '#FFFFFF' : isAnswered ? '#15803D' : '#475569',
                      border: isCurrent ? '1px solid #D97706' : '1px solid #E2E8F0',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Current Question Statement */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Typography>
            <Chip
              label={`${currentMcq.points || 5} Points`}
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }}
            />
          </Stack>

          <Typography variant="body1" sx={{ color: '#1E293B', mb: 3, fontSize: '1.05rem', lineHeight: 1.6 }}>
            {currentMcq.questionText}
          </Typography>

          {/* MCQ Options */}
          <FormControl component="fieldset" sx={{ width: '100%', mb: 4 }}>
            <RadioGroup
              value={answers[currentMcq.id] !== undefined ? answers[currentMcq.id] : ''}
              onChange={(e) => handleSelectOption(currentMcq.id, e.target.value)}
            >
              <Stack spacing={1.5}>
                {currentMcq.options?.map((opt, oIdx) => {
                  const isSelected = answers[currentMcq.id] === oIdx;
                  return (
                    <Paper
                      key={oIdx}
                      elevation={0}
                      onClick={() => handleSelectOption(currentMcq.id, oIdx)}
                      sx={{
                        p: 1.75,
                        px: 2.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        borderColor: isSelected ? '#F59E0B' : '#E2E8F0',
                        bgcolor: isSelected ? 'rgba(245, 158, 11, 0.08)' : '#FAFAFA',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                        },
                      }}
                    >
                      <FormControlLabel
                        value={oIdx}
                        control={<Radio size="small" sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#D97706' } }} />}
                        label={
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: '#0F172A' }}>
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

          {/* Navigation Controls */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}
            >
              Previous Question
            </Button>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                sx={{
                  bgcolor: '#F59E0B',
                  '&:hover': { bgcolor: '#D97706' },
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Next Question
              </Button>
            ) : hasCoding ? (
              <Button
                variant="contained"
                endIcon={<CodeRoundedIcon />}
                onClick={() => setActiveSection(1)}
                sx={{
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Proceed to Coding Section
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setShowConfirm(true)}
                sx={{
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Submit Test
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* SECTION 2: CODING CHALLENGES */}
      {activeSection === 1 && hasCoding && currentCodingProblem && (
        <Box>
          {/* Coding Problem Selector Tabs */}
          {quiz.codingProblems.length > 1 && (
            <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 1 }}>
                  CHALLENGES:
                </Typography>
                {quiz.codingProblems.map((cp, idx) => {
                  const isCurrent = idx === currentProblemIndex;
                  const sol = codingSolutions[cp.problemId];
                  return (
                    <Chip
                      key={cp.problemId}
                      label={`Problem ${idx + 1}: ${cp.title} (${cp.points || 20} pts)`}
                      onClick={() => setCurrentProblemIndex(idx)}
                      color={isCurrent ? 'primary' : sol ? 'success' : 'default'}
                      variant={isCurrent ? 'filled' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: isCurrent ? 700 : 500,
                        bgcolor: isCurrent ? '#F59E0B' : 'transparent',
                        color: isCurrent ? '#FFFFFF' : 'text.primary',
                      }}
                    />
                  );
                })}
              </Stack>
            </Paper>
          )}

          {/* Split Screen Workspace */}
          <Grid container spacing={2}>
            {/* Left: Problem Statement */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  height: 'calc(100vh - 250px)',
                  overflowY: 'auto',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {currentCodingProblem.title}
                  </Typography>
                  <Chip
                    label={`${currentCodingProblem.points || 20} Marks`}
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700 }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip size="small" label={currentCodingProblem.difficulty || 'Medium'} variant="outlined" />
                  <Chip size="small" label={`${currentCodingProblem.timeLimitMs || 1000} ms`} variant="outlined" />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Description:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line', mb: 2.5, lineHeight: 1.6 }}>
                  {currentCodingProblem.description || 'No description provided.'}
                </Typography>

                {currentCodingProblem.constraints && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                      Constraints:
                    </Typography>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#334155' }}>
                        {currentCodingProblem.constraints}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {currentCodingProblem.sampleTestCases && currentCodingProblem.sampleTestCases.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                      Sample Test Cases:
                    </Typography>
                    {currentCodingProblem.sampleTestCases.map((stc, sIdx) => (
                      <Paper
                        key={sIdx}
                        elevation={0}
                        sx={{ p: 1.5, mb: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                          Input:
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", display: 'block', mb: 1 }}>
                          {stc.input || '(empty)'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                          Expected Output:
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#10B981', fontWeight: 600 }}>
                          {stc.expectedOutput || '(empty)'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right: Monaco Editor & Console */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  height: 'calc(100vh - 250px)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Editor Header Bar with Allowed Languages */}
                <Box sx={{ p: 1.5, bgcolor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      Language:
                    </Typography>
                    <Select
                      size="small"
                      value={activeLanguage}
                      onChange={(e) => setActiveLanguage(e.target.value)}
                      sx={{
                        height: 32,
                        bgcolor: '#1E293B',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                      }}
                    >
                      {selectableLanguages.map((lang) => (
                        <MenuItem key={lang.key} value={lang.key}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrowRoundedIcon />}
                      onClick={handleRunCode}
                      disabled={runningCode}
                      sx={{
                        color: '#E2E8F0',
                        borderColor: '#334155',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { borderColor: '#94A3B8', bgcolor: '#1E293B' },
                      }}
                    >
                      Run Custom Input
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      onClick={handleSaveProblemCode}
                      disabled={runningCode}
                      sx={{
                        bgcolor: '#F59E0B',
                        '&:hover': { bgcolor: '#D97706' },
                        color: '#0F172A',
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      Verify & Save Solution
                    </Button>
                  </Stack>
                </Box>

                {/* Monaco Code Editor */}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <Editor
                    height="100%"
                    language={MONACO_LANGUAGE_ID[activeLanguage] || 'java'}
                    theme="vs-dark"
                    value={currentCode}
                    onChange={handleCodeChange}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      automaticLayout: true,
                    }}
                  />
                </Box>

                {/* Console Output Drawer */}
                <Box sx={{ borderTop: '1px solid #E2E8F0', p: 1.5, bgcolor: '#F8FAFC', maxHeight: 130, overflowY: 'auto' }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Custom stdin input (e.g. 5\n1 2 3 4 5)..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      sx={{ flex: 1 }}
                      inputProps={{ style: { fontSize: 12, fontFamily: "'JetBrains Mono', monospace" } }}
                    />
                  </Stack>

                  {consoleOutput && (
                    <Paper elevation={0} sx={{ p: 1, bgcolor: '#0F172A', borderRadius: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: consoleOutput.includes('✓') ? '#4ADE80' : '#F87171',
                          whiteSpace: 'pre-wrap',
                          display: 'block',
                        }}
                      >
                        {consoleOutput}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Confirmation Submit Modal */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Assessment Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#334155' }}>
            Are you sure you want to finish and submit your test?
          </Typography>
          <Stack spacing={0.5} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            {hasMcqs && (
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                • MCQs Answered: {answeredCount} / {quiz.questions.length}
              </Typography>
            )}
            {hasCoding && (
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                • Coding Solutions Saved: {Object.keys(codingSolutions).length} / {quiz.codingProblems.length}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowConfirm(false)} sx={{ color: 'text.secondary' }}>
            Continue Working
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalSubmit}
            disabled={submitting}
            sx={{
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            {submitting ? 'Submitting...' : 'Yes, Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizAttemptPage;
