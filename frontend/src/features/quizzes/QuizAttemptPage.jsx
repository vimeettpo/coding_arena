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
  Tooltip,
  IconButton,
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
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate } from 'react-router-dom';

import quizService from '@/services/quizService';
import problemService from '@/services/problemService';
import { LANGUAGE_BOILERPLATE, MONACO_LANGUAGE_ID, defineMonacoThemes } from '../problems/monacoConfig';

const ALL_LANGUAGES = [
  { key: 'JAVA', label: 'Java', monaco: 'java' },
  { key: 'PYTHON', label: 'Python 3', monaco: 'python' },
  { key: 'CPP', label: 'C++', monaco: 'cpp' },
  { key: 'C', label: 'C', monaco: 'c' },
  { key: 'JAVASCRIPT', label: 'JavaScript', monaco: 'javascript' },
];

// Checks if the student's code reads user input (so we know whether to ask for input before running).
// Comments are removed first so a word like "input" inside a comment does not trigger it.
const INPUT_PATTERNS = {
  PYTHON: /\binput\s*\(|sys\.stdin|fileinput/,
  JAVA: /\bScanner\b|\bBufferedReader\b|System\.in\b|\bConsole\b/,
  C: /\bscanf\s*\(|\bgets\s*\(|\bfgets\s*\(|\bgetchar\s*\(|\bgetc\s*\(|\bfscanf\s*\(/,
  CPP: /\bcin\b|\bscanf\s*\(|\bgetline\s*\(|\bgets\s*\(|\bgetchar\s*\(|\bfgets\s*\(/,
  JAVASCRIPT: /\breadline\b|\bstdin\b|process\.stdin|\bprompt\s*\(/,
};

const codeNeedsInput = (code, language) => {
  let clean = code || '';
  if (language === 'PYTHON') {
    clean = clean.replace(/#.*$/gm, '');
  } else {
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  }
  const pattern = INPUT_PATTERNS[language];
  return pattern ? pattern.test(clean) : false;
};

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
  const [codingSolutions, setCodingSolutions] = useState({}); // verified results: { [problemId]: { code, language, score, status } }
  const [codeDrafts, setCodeDrafts] = useState({}); // what the student is typing: { [problemId]: { [LANGUAGE]: code } }
  const [activeLanguage, setActiveLanguage] = useState('JAVA');
  const [customInput, setCustomInput] = useState(''); // stdin typed by the student (remembered for the next run)
  const [awaitingInput, setAwaitingInput] = useState(false); // true = terminal is asking the student to type input
  const [lastInput, setLastInput] = useState(''); // the input used in the last run (shown in the terminal)
  const [consoleOutput, setConsoleOutput] = useState(null); // { text, type, runtimeMs } where type = 'success' | 'error' | 'info'
  const [runningCode, setRunningCode] = useState(false);
  const [showProblem, setShowProblem] = useState(true); // show/hide the problem statement panel

  // Timer & Confirmation state
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  // Small helpers to convert the language key (JAVA, PYTHON...) for the editor and boilerplate.
  // The helper files use lowercase keys, while this page uses UPPERCASE keys.
  const monacoLangId = MONACO_LANGUAGE_ID[activeLanguage.toLowerCase()] || 'java';
  const getBoilerplate = (lang) => LANGUAGE_BOILERPLATE[lang.toLowerCase()] || '';

  // Current code in editor: the student's draft for this problem + language, or the starter template
  const currentCode = useMemo(() => {
    if (!currentCodingProblem) return '';
    const draft = codeDrafts[currentCodingProblem.problemId]?.[activeLanguage];
    return draft !== undefined ? draft : getBoilerplate(activeLanguage);
  }, [codeDrafts, currentCodingProblem, activeLanguage]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(optionIndex),
    }));
  };

  // Save what the student types (separately for every problem and every language)
  const handleCodeChange = (newCode) => {
    if (!currentCodingProblem) return;
    const pId = currentCodingProblem.problemId;
    setCodeDrafts((prev) => ({
      ...prev,
      [pId]: { ...(prev[pId] || {}), [activeLanguage]: newCode ?? '' },
    }));
  };

  // Show a message in the terminal
  const showOutput = (text, type = 'info', runtimeMs = null) => setConsoleOutput({ text, type, runtimeMs });

  // Actually sends the code to the compiler with the given input text
  const runProgram = async (inputText) => {
    if (!currentCodingProblem) return;
    setAwaitingInput(false);
    setLastInput(inputText);
    setRunningCode(true);
    showOutput('Running...', 'info');

    try {
      const slug = currentCodingProblem.slug;
      let res;
      if (slug) {
        res = await problemService.run(slug, {
          language: activeLanguage,
          code: currentCode,
          customInput: inputText,
        });
      } else {
        res = await problemService.compile({
          language: activeLanguage,
          code: currentCode,
          input: inputText,
          stdin: inputText,
        });
      }
      const data = res.data || res;
      const text = data.output || data.stdout || data.stderr || '';
      const failed = data.verdict && data.verdict !== 'ACCEPTED';

      if (!text.trim()) {
        showOutput('(Program finished without printing anything)', 'info', data.runtimeMs);
      } else {
        showOutput(text, failed ? 'error' : 'success', data.runtimeMs);
      }
    } catch (err) {
      showOutput(err.response?.data?.message || err.message || 'Execution error.', 'error');
    } finally {
      setRunningCode(false);
    }
  };

  // Run button:
  //  - program reads input  -> ask for the input inside the terminal first
  //  - program has no input -> run immediately and show the output
  const handleRunCode = () => {
    if (!currentCodingProblem) return;
    if (codeNeedsInput(currentCode, activeLanguage)) {
      setConsoleOutput(null);
      setAwaitingInput(true);
    } else {
      runProgram('');
    }
  };

  // Submit and verify code for current problem
  const handleSaveProblemCode = async () => {
    if (!currentCodingProblem) return;
    setAwaitingInput(false); // close the input prompt so the verdict is visible
    setLastInput('');
    setRunningCode(true);
    showOutput('Validating solution against test cases...', 'info');

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

      showOutput(
        isAccepted
          ? `✓ Accepted! All test cases passed (${points}/${currentCodingProblem.points || 20} points awarded).`
          : `✗ Test evaluation: ${data.judgeOutput || data.verdict || 'Wrong Answer or Runtime Error'}`,
        isAccepted ? 'success' : 'error'
      );
    } catch (err) {
      showOutput(err.response?.data?.message || 'Verification error.', 'error');
    } finally {
      setRunningCode(false);
    }
  };

  // Final Assessment Submit
  const handleFinalSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    // Send every problem the student worked on. Verified ones keep their score,
    // problems that were only typed (never verified) are sent with 0 score.
    const touchedIds = Array.from(new Set([...Object.keys(codingSolutions), ...Object.keys(codeDrafts)]));
    const codingSubmissionsArray = touchedIds.map((pId) => {
      const verified = codingSolutions[pId];
      if (verified) {
        return {
          problemId: pId,
          code: verified.code || '',
          language: verified.language || activeLanguage,
          score: verified.score || 0,
          status: verified.status || 'SUBMITTED',
        };
      }
      const draftLang = Object.keys(codeDrafts[pId] || {})[0] || activeLanguage;
      return {
        problemId: pId,
        code: codeDrafts[pId]?.[draftLang] || '',
        language: draftLang,
        score: 0,
        status: 'SUBMITTED',
      };
    });

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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Tooltip title="Exit Test">
              <IconButton
                onClick={() => setShowExitConfirm(true)}
                size="small"
                sx={{
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  '&:hover': { bgcolor: '#F1F5F9', color: '#DC2626' },
                  borderRadius: 2,
                  p: 0.75,
                }}
              >
                <ArrowBackRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
          </Stack>

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

          {/* ============ ONLINE COMPILER WORKSPACE ============ */}
          {/* Desktop: [ Problem | Editor | Output terminal ].  Small screens: everything stacked. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              height: { md: 'calc(100vh - 260px)' },
              minHeight: { md: 560 },
            }}
          >
            {/* LEFT: Problem Statement (can be hidden) */}
            {showProblem && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  flex: { md: '0 0 32%' },
                  minWidth: 0,
                  maxHeight: { xs: 360, md: 'none' },
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
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                            Input:
                          </Typography>
                          {/* One click runs your code with this sample input */}
                          <Button
                            size="small"
                            disabled={runningCode}
                            onClick={() => {
                              setCustomInput(stc.input || '');
                              runProgram(stc.input || '');
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 0, py: 0 }}
                          >
                            Run with this input
                          </Button>
                        </Stack>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "'JetBrains Mono', monospace", display: 'block', mb: 1, whiteSpace: 'pre-wrap' }}
                        >
                          {stc.input || '(empty)'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                          Expected Output:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#10B981', fontWeight: 600, whiteSpace: 'pre-wrap' }}
                        >
                          {stc.expectedOutput || '(empty)'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {/* RIGHT: Compiler (toolbar + editor + output terminal) */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                borderRadius: 3,
                bgcolor: '#0B1220',
                border: '1px solid #1E293B',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Toolbar: language + buttons */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#0F172A',
                  borderBottom: '1px solid #1E293B',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    size="small"
                    onClick={() => setShowProblem((v) => !v)}
                    startIcon={<MenuBookRoundedIcon />}
                    sx={{ color: '#CBD5E1', textTransform: 'none', fontWeight: 600 }}
                  >
                    {showProblem ? 'Hide Problem' : 'Show Problem'}
                  </Button>

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
                    variant="contained"
                    startIcon={runningCode ? <CircularProgress size={14} color="inherit" /> : <PlayArrowRoundedIcon />}
                    onClick={handleRunCode}
                    disabled={runningCode}
                    sx={{
                      bgcolor: '#2563EB',
                      '&:hover': { bgcolor: '#1D4ED8' },
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2.5,
                    }}
                  >
                    Run
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

              {/* Body: Editor (left) and Output terminal (right) */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: { xs: 'column', lg: 'row' },
                }}
              >
                {/* Code Editor */}
                <Box sx={{ flex: { lg: 3 }, minWidth: 0, minHeight: { xs: 380, lg: 0 }, height: { xs: 380, lg: 'auto' } }}>
                  <Editor
                    height="100%"
                    language={monacoLangId}
                    theme="ca-dark"
                    beforeMount={defineMonacoThemes}
                    value={currentCode}
                    onChange={handleCodeChange}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      automaticLayout: true,
                      padding: { top: 12 },
                    }}
                  />
                </Box>

                {/* ONE merged terminal: output, and the input prompt when the program needs input */}
                <Box
                  sx={{
                    flex: { lg: 2 },
                    minWidth: 0,
                    minHeight: { xs: 300, lg: 0 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: { lg: '1px solid #1E293B' },
                    borderTop: { xs: '1px solid #1E293B', lg: 'none' },
                    bgcolor: '#0B1220',
                  }}
                >
                  {/* Terminal title bar */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1, bgcolor: '#1F2937', borderBottom: '1px solid #1E293B' }}
                  >
                    <Typography variant="caption" sx={{ color: '#E5E7EB', fontWeight: 700, letterSpacing: 0.5 }}>
                      Output
                    </Typography>
                    {(consoleOutput || awaitingInput) && (
                      <Button
                        size="small"
                        onClick={() => {
                          setConsoleOutput(null);
                          setAwaitingInput(false);
                        }}
                        sx={{ color: '#9CA3AF', textTransform: 'none', fontSize: '0.7rem', minWidth: 0, py: 0 }}
                      >
                        Clear
                      </Button>
                    )}
                  </Stack>

                  {/* Terminal body */}
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'auto',
                      p: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: '#E5E7EB',
                    }}
                  >
                    {/* State 1: the program needs input -> ask for it here */}
                    {awaitingInput && (
                      <Box>
                        <Typography
                          component="div"
                          sx={{ color: '#FBBF24', fontFamily: 'inherit', fontSize: 'inherit', mb: 1 }}
                        >
                          ⌨ This program reads input. Type it below (one value per line), then press Ctrl + Enter.
                        </Typography>
                        <Box
                          component="textarea"
                          autoFocus
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          onKeyDown={(e) => {
                            // Ctrl+Enter (or Cmd+Enter) runs the program with the typed input
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              runProgram(customInput);
                            }
                          }}
                          placeholder={'Example:\n5\n1 2 3 4 5'}
                          spellCheck={false}
                          rows={6}
                          sx={{
                            width: '100%',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            p: 1.25,
                            bgcolor: '#111827',
                            color: '#F9FAFB',
                            border: '1px solid #F59E0B',
                            borderRadius: 1.5,
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                          }}
                        />
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrowRoundedIcon />}
                            onClick={() => runProgram(customInput)}
                            sx={{
                              bgcolor: '#2563EB',
                              '&:hover': { bgcolor: '#1D4ED8' },
                              textTransform: 'none',
                              fontWeight: 700,
                            }}
                          >
                            Run with input
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setAwaitingInput(false)}
                            sx={{ color: '#9CA3AF', textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Box>
                    )}

                    {/* State 2: show what was typed + the program output */}
                    {!awaitingInput && consoleOutput && (
                      <Box>
                        {lastInput.trim() && consoleOutput.text !== 'Running...' && (
                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              component="div"
                              sx={{ color: '#9CA3AF', fontFamily: 'inherit', fontSize: 12, mb: 0.25 }}
                            >
                              Input:
                            </Typography>
                            <Box component="pre" sx={{ m: 0, color: '#93C5FD', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                              {lastInput}
                            </Box>
                          </Box>
                        )}

                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            fontFamily: 'inherit',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color:
                              consoleOutput.type === 'success'
                                ? '#4ADE80'
                                : consoleOutput.type === 'error'
                                ? '#F87171'
                                : '#9CA3AF',
                          }}
                        >
                          {consoleOutput.text}
                        </Box>

                        {consoleOutput.type !== 'info' && consoleOutput.runtimeMs !== null && consoleOutput.runtimeMs !== undefined && (
                          <Typography
                            component="div"
                            sx={{ mt: 1.5, color: '#6B7280', fontFamily: 'inherit', fontSize: 12 }}
                          >
                            {consoleOutput.type === 'success' ? '=== Code Execution Successful' : '=== Execution Finished with Errors'} ({consoleOutput.runtimeMs} ms) ===
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* State 3: nothing yet */}
                    {!awaitingInput && !consoleOutput && (
                      <Typography component="div" sx={{ color: '#6B7280', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        Click "Run" to see the output here.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
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

      {/* Exit Test Confirmation Modal */}
      <Dialog open={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Exit Assessment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#334155' }}>
            Are you sure you want to leave this test session? If you leave, your answers will not be automatically submitted and the countdown timer will continue running until the deadline.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowExitConfirm(false)} sx={{ color: 'text.secondary', textTransform: 'none' }}>
            Stay in Test
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => navigate('/quizzes')}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Leave Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizAttemptPage;