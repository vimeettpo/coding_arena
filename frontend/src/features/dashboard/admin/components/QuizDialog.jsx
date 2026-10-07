import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress,
  Chip,
  Box,
  Typography,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import quizService from '@/services/quizService';
import adminService from '@/services/adminService';
import { COLLEGE_BRANCHES } from '../adminConstants';

const ALL_LANGUAGES = [
  { key: 'JAVA', label: 'Java' },
  { key: 'PYTHON', label: 'Python 3' },
  { key: 'CPP', label: 'C++' },
  { key: 'C', label: 'C' },
  { key: 'JAVASCRIPT', label: 'JavaScript' },
];

const QuizDialog = ({ open, onClose, onSuccess }) => {
  // Which tab is open: 'settings' | 'mcq' | 'coding'
  const [tab, setTab] = useState('settings');

  // NEW: what kind of test is this? 'MCQ' (only MCQs), 'CODING' (only coding), 'MIXED' (both)
  const [testType, setTestType] = useState('MCQ');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [targetBranch, setTargetBranch] = useState('ALL');
  const [targetYear, setTargetYear] = useState('ALL');
  const [allowedLanguages, setAllowedLanguages] = useState([]);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [passingPercentage, setPassingPercentage] = useState(40);

  // MCQs
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      points: 5,
    },
  ]);

  // Coding Questions
  const [codingProblems, setCodingProblems] = useState([]); // [{ problemId, points, title, difficulty }]
  const [bankProblems, setBankProblems] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [problemSearch, setProblemSearch] = useState('');

  useEffect(() => {
    if (open) {
      setTab('settings');
      setTestType('MCQ');
      setError('');
      setTitle('');
      setDescription('');
      setDurationMinutes(30);
      setStartTime('');
      setEndTime('');
      setTargetBranch('ALL');
      setTargetYear('ALL');
      setAllowedLanguages([]);
      setNegativeMarking(false);
      setNegativeMarks(1);
      setPassingPercentage(40);
      setQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 5,
        },
      ]);
      setCodingProblems([]);

      // Fetch problem bank
      setLoadingBank(true);
      adminService
        .getProblems({ size: 100 })
        .then((res) => {
          setBankProblems(res.content || []);
        })
        .catch(() => {})
        .finally(() => setLoadingBank(false));
    }
  }, [open]);

  // Language toggle
  const toggleLanguage = (langKey) => {
    setAllowedLanguages((prev) =>
      prev.includes(langKey) ? prev.filter((l) => l !== langKey) : [...prev, langKey]
    );
  };

  // MCQ handlers
  const handleAddMcq = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 5,
      },
    ]);
  };

  const handleRemoveMcq = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMcqChange = (idx, field, val) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[optIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  // Coding Problem handlers
  const handleToggleCodingProblem = (p) => {
    setCodingProblems((prev) => {
      const exists = prev.find((cp) => cp.problemId === p.id);
      if (exists) {
        return prev.filter((cp) => cp.problemId !== p.id);
      } else {
        return [
          ...prev,
          {
            problemId: p.id,
            title: p.title,
            difficulty: p.difficulty,
            points: 20,
          },
        ];
      }
    });
  };

  const handleCodingPointsChange = (problemId, points) => {
    setCodingProblems((prev) =>
      prev.map((cp) => (cp.problemId === problemId ? { ...cp, points: Math.max(1, Number(points) || 1) } : cp))
    );
  };

  // Filtered problem bank
  const filteredBankProblems = useMemo(() => {
    if (!problemSearch.trim()) return bankProblems;
    const q = problemSearch.toLowerCase().trim();
    return bankProblems.filter((p) => p.title?.toLowerCase().includes(q) || p.difficulty?.toLowerCase().includes(q));
  }, [bankProblems, problemSearch]);

  // ---------- NEW: which sections does this test type use? ----------
  const showMcq = testType === 'MCQ' || testType === 'MIXED';
  const showCoding = testType === 'CODING' || testType === 'MIXED';

  // The tabs that are visible for the chosen test type (Settings is always first)
  const tabKeys = ['settings', ...(showMcq ? ['mcq'] : []), ...(showCoding ? ['coding'] : [])];
  const tabIndex = tabKeys.indexOf(tab);

  // A completely empty MCQ card is ignored (so it never blocks publishing or counts marks)
  const isBlankMcq = (q) => !q.questionText.trim() && q.options.every((o) => !o.trim());
  const filledQuestions = useMemo(() => questions.filter((q) => !isBlankMcq(q)), [questions]);

  // Total points calculation (only counts the sections used by this test type)
  const totalMcqPoints = useMemo(() => {
    if (!showMcq) return 0;
    return filledQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  }, [filledQuestions, showMcq]);

  const totalCodingPoints = useMemo(() => {
    if (!showCoding) return 0;
    return codingProblems.reduce((sum, cp) => sum + (Number(cp.points) || 0), 0);
  }, [codingProblems, showCoding]);

  const totalMarks = totalMcqPoints + totalCodingPoints;

  // Submit test
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a test title.');
      setTab('settings');
      return;
    }

    // ---------- Validate ONLY the section(s) that belong to this test type ----------
    let cleanQuestions = []; // MCQs we will send to the server

    if (showMcq) {
      if (filledQuestions.length === 0) {
        setError('Please add at least one MCQ question before publishing.');
        setTab('mcq');
        return;
      }

      for (let i = 0; i < filledQuestions.length; i++) {
        const q = filledQuestions[i];
        const filledOptions = q.options.filter((o) => o.trim());

        if (!q.questionText.trim()) {
          setError(`MCQ ${i + 1}: question text is empty.`);
          setTab('mcq');
          return;
        }
        if (filledOptions.length < 2) {
          setError(`MCQ ${i + 1}: please fill at least 2 options.`);
          setTab('mcq');
          return;
        }
        if (!q.options[q.correctOptionIndex]?.trim()) {
          setError(`MCQ ${i + 1}: the selected correct option is empty. Pick a filled option.`);
          setTab('mcq');
          return;
        }
      }

      // Remove blank options and re-calculate which option is the correct one
      cleanQuestions = filledQuestions.map((q) => {
        const options = [];
        let correctIndex = 0;
        q.options.forEach((opt, i) => {
          if (opt.trim()) {
            if (i === q.correctOptionIndex) correctIndex = options.length;
            options.push(opt.trim());
          }
        });
        return {
          questionText: q.questionText.trim(),
          options,
          correctOptionIndex: correctIndex,
          points: Number(q.points) || 5,
        };
      });
    }

    if (showCoding && codingProblems.length === 0) {
      setError('Please select at least one coding problem before publishing.');
      setTab('coding');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 30,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        targetBranch,
        targetYear: targetYear === 'ALL' ? null : Number(targetYear),
        // Languages only matter for coding tests
        allowedLanguages: showCoding ? allowedLanguages : [],
        // Negative marking only matters for MCQ tests
        negativeMarking: showMcq ? negativeMarking : false,
        negativeMarks: showMcq && negativeMarking ? Number(negativeMarks) || 0 : 0,
        passingPercentage: Number(passingPercentage) || 40,
        // An MCQ-only test sends NO coding problems, a coding-only test sends NO MCQs
        questions: showMcq ? cleanQuestions : [],
        codingProblems: showCoding
          ? codingProblems.map((cp) => ({
              problemId: cp.problemId,
              points: Number(cp.points) || 20,
            }))
          : [],
      };

      await quizService.create(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, bgcolor: '#FFFFFF' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Create Custom Assessment / Test
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Compose hybrid evaluations with MCQs, practical coding challenges, and strict branch/year targeting.
            </Typography>
          </Box>
          <Chip
            label={`Total: ${totalMarks} Marks`}
            sx={{
              bgcolor: '#FEF3C7',
              color: '#B45309',
              fontWeight: 800,
              fontSize: '0.85rem',
              border: '1px solid #FDE68A',
            }}
          />
        </Stack>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: '#E2E8F0', bgcolor: '#F8FAFC', px: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab
            value="settings"
            icon={<TuneRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="1. Test Settings"
          />
          {/* MCQ tab is hidden for a Coding-only test */}
          {showMcq && (
            <Tab
              value="mcq"
              icon={<QuizRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`${tabKeys.indexOf('mcq') + 1}. MCQs (${filledQuestions.length})`}
            />
          )}
          {/* Coding tab is hidden for an MCQ-only test */}
          {showCoding && (
            <Tab
              value="coding"
              icon={<CodeRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`${tabKeys.indexOf('coding') + 1}. Coding Problems (${codingProblems.length})`}
            />
          )}
        </Tabs>
      </Box>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3, maxHeight: '65vh', overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* TAB 0: SETTINGS */}
          {tab === 'settings' && (
            <Stack spacing={2.5}>
              {/* NEW: choose what this test contains */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Test Type
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={testType}
                  onChange={(_, v) => v && setTestType(v)} // v is null if the same button is clicked again
                >
                  <ToggleButton value="MCQ" sx={{ textTransform: 'none', fontWeight: 700 }}>
                    MCQ Test Only
                  </ToggleButton>
                  <ToggleButton value="CODING" sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Coding Test Only
                  </ToggleButton>
                  <ToggleButton value="MIXED" sx={{ textTransform: 'none', fontWeight: 700 }}>
                    MCQ + Coding
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TextField
                fullWidth
                label="Test Title"
                required
                placeholder="e.g. Data Structures & OOPs Combined Evaluation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Test Instructions & Syllabus"
                placeholder="Details on topics covered, guidelines, and passing criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (Minutes)"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  inputProps={{ min: 5, max: 360 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Passing Percentage (%)"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Scheduled Start Time (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Scheduled End Time (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Target Branch Restriction"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                >
                  <MenuItem value="ALL">All Branches (Open to entire College)</MenuItem>
                  {COLLEGE_BRANCHES.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Target Academic Year"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                >
                  <MenuItem value="ALL">All Academic Years</MenuItem>
                  <MenuItem value={1}>1st Year (FE)</MenuItem>
                  <MenuItem value={2}>2nd Year (SE)</MenuItem>
                  <MenuItem value={3}>3rd Year (TE)</MenuItem>
                  <MenuItem value={4}>Final Year (BE)</MenuItem>
                </TextField>
              </Stack>

              {/* Language customisation (only for tests that have coding problems) */}
              {showCoding && (
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                  Allowed Programming Languages{' '}
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                    ({allowedLanguages.length === 0 ? 'All Languages Permitted' : `${allowedLanguages.length} Selected`})
                  </Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                  Restrict students to specific coding languages (e.g. for Java Lab or Python evaluation). Leave unselected for all languages.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {ALL_LANGUAGES.map((lang) => {
                    const isSelected = allowedLanguages.includes(lang.key);
                    return (
                      <Chip
                        key={lang.key}
                        label={lang.label}
                        onClick={() => toggleLanguage(lang.key)}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          bgcolor: isSelected ? '#F59E0B' : 'transparent',
                          color: isSelected ? '#FFFFFF' : 'text.primary',
                          borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
              )}

              {/* Negative marking (only for tests that have MCQs) */}
              {showMcq && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems="center"
                sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Negative Marking for MCQs"
                  sx={{ whiteSpace: 'nowrap' }}
                />

                {negativeMarking && (
                  <TextField
                    type="number"
                    label="Penalty Deducted Per Wrong MCQ"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(e.target.value)}
                    inputProps={{ min: 0.25, step: 0.25 }}
                    sx={{ width: { xs: '100%', sm: 220 } }}
                  />
                )}
              </Stack>
              )}
            </Stack>
          )}

          {/* TAB 1: MCQs */}
          {tab === 'mcq' && showMcq && (
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Multiple Choice Questions ({filledQuestions.length} Questions • {totalMcqPoints} Marks)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAddMcq}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                >
                  Add MCQ
                </Button>
              </Stack>

              {questions.map((q, qIdx) => (
                <Paper
                  key={qIdx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid #E2E8F0',
                    borderRadius: 2.5,
                    bgcolor: '#FFFFFF',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Chip
                      label={`MCQ Question ${qIdx + 1}`}
                      size="small"
                      sx={{ bgcolor: '#F1F5F9', fontWeight: 700, color: '#0F172A' }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        type="number"
                        size="small"
                        label="Points"
                        value={q.points}
                        onChange={(e) => handleMcqChange(qIdx, 'points', Number(e.target.value))}
                        inputProps={{ min: 1 }}
                        sx={{ width: 85 }}
                      />
                      {questions.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveMcq(qIdx)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  <TextField
                    fullWidth
                    label="Question Statement"
                    placeholder="Enter the question text..."
                    value={q.questionText}
                    onChange={(e) => handleMcqChange(qIdx, 'questionText', e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', mb: 1, display: 'block' }}>
                    Select the Radio Button next to the Correct Option:
                  </Typography>

                  <RadioGroup
                    value={q.correctOptionIndex}
                    onChange={(e) => handleMcqChange(qIdx, 'correctOptionIndex', Number(e.target.value))}
                  >
                    <Stack spacing={1.25}>
                      {q.options.map((opt, optIdx) => (
                        <Stack key={optIdx} direction="row" spacing={1} alignItems="center">
                          <Radio value={optIdx} size="small" color="success" />
                          <TextField
                            fullWidth
                            size="small"
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  </RadioGroup>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddMcq}
                sx={{
                  py: 1.5,
                  border: '1px dashed #CBD5E1',
                  borderRadius: 2.5,
                  color: '#475569',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
                }}
              >
                + Add Another MCQ
              </Button>
            </Stack>
          )}

          {/* TAB 2: CODING QUESTIONS */}
          {tab === 'coding' && showCoding && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                  Practical Coding Challenges ({codingProblems.length} Selected • {totalCodingPoints} Marks)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Pick problems from your Code Bank to evaluate practical algorithms, data structures, or language syntax.
                </Typography>
              </Box>

              {/* Selected Coding Problems List */}
              {codingProblems.length > 0 && (
                <Stack spacing={1.5} sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Included in this Test:
                  </Typography>
                  {codingProblems.map((cp) => (
                    <Paper
                      key={cp.problemId}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CheckCircleRoundedIcon sx={{ color: '#10B981', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {cp.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Difficulty: {cp.difficulty}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                          type="number"
                          size="small"
                          label="Marks"
                          value={cp.points}
                          onChange={(e) => handleCodingPointsChange(cp.problemId, e.target.value)}
                          inputProps={{ min: 5, max: 100 }}
                          sx={{ width: 90 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleToggleCodingProblem({ id: cp.problemId })}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Browse Problem Bank */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Browse Code Bank ({bankProblems.length} available)
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Search problem title..."
                    value={problemSearch}
                    onChange={(e) => setProblemSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 220 }}
                  />
                </Stack>

                {loadingBank ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading Code Bank...
                    </Typography>
                  </Box>
                ) : filteredBankProblems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No matching coding problems found in bank.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      border: '1px solid #E2E8F0',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    {filteredBankProblems.map((p) => {
                      const isSelected = codingProblems.some((cp) => cp.problemId === p.id);
                      return (
                        <Chip
                          key={p.id}
                          label={`${p.title} (${p.difficulty})`}
                          onClick={() => handleToggleCodingProblem(p)}
                          color={isSelected ? 'primary' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: isSelected ? 700 : 500,
                            bgcolor: isSelected ? '#10B981' : 'transparent',
                            color: isSelected ? '#FFFFFF' : 'text.primary',
                            borderColor: isSelected ? '#10B981' : '#CBD5E1',
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1}>
            {tabIndex > 0 && (
              <Button onClick={() => setTab(tabKeys[tabIndex - 1])} sx={{ color: 'text.secondary' }}>
                Back
              </Button>
            )}
            {tabIndex < tabKeys.length - 1 && (
              <Button onClick={() => setTab(tabKeys[tabIndex + 1])} sx={{ fontWeight: 700 }}>
                Next: {tabKeys[tabIndex + 1] === 'mcq' ? 'MCQs' : 'Coding Problems'}
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: '#F59E0B',
                '&:hover': { bgcolor: '#D97706' },
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
              }}
            >
              {submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : testType === 'MCQ' ? (
                'Publish MCQ Test'
              ) : testType === 'CODING' ? (
                'Publish Coding Test'
              ) : (
                'Publish Test'
              )}
            </Button>
          </Stack>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuizDialog;