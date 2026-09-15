import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Skeleton,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import quizService from '@/services/quizService';

const STATUS_STYLE = {
  LIVE: { label: 'Live Now', color: '#15803D', bgcolor: '#DCFCE7', border: '1px solid #BBF7D0' },
  UPCOMING: { label: 'Upcoming', color: '#0284C7', bgcolor: '#E0F2FE', border: '1px solid #BAE6FD' },
  ENDED: { label: 'Ended', color: '#64748B', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0' },
};

const TrainerQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      points: 5,
    },
  ]);

  const loadQuizzes = () => {
    setLoading(true);
    quizService
      .list()
      .then((res) => setQuizzes(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tests.'))
      .finally(() => setLoading(false));
  };

  const handleDeleteQuiz = (id) => {
    setDeleting(true);
    quizService
      .delete(id)
      .then(() => {
        setDeleteTargetId(null);
        loadQuizzes();
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to delete test.'))
      .finally(() => setDeleting(false));
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 5,
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      description,
      durationMinutes: Number(durationMinutes || 30),
      questions: questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: Number(q.correctOptionIndex),
        points: Number(q.points || 5),
      })),
    };

    quizService
      .create(payload)
      .then(() => {
        setOpenModal(false);
        resetForm();
        loadQuizzes();
      })
      .catch((err) => {
        if (err.response?.status === 401) return;
        alert(err.response?.data?.message || 'Failed to create test.');
      })
      .finally(() => setSubmitting(false));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDurationMinutes(30);
    setQuestions([
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 5,
      },
    ]);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            Tests & Assessments
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Create auto-graded assessments with MCQ answer keys, timer controls, and instant scoring.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 2.5,
            py: 1,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
          }}
        >
          Create New Test
        </Button>
      </Stack>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : quizzes.length > 0 ? (
        <Grid container spacing={2.5}>
          {quizzes.map((q) => {
            const statusKey = q.status || 'LIVE';
            const style = STATUS_STYLE[statusKey] || STATUS_STYLE.LIVE;
            const qCount = q.questionsCount ?? q.questionCount ?? (q.questions ? q.questions.length : 10);

            return (
              <Grid item xs={12} md={6} key={q.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Box sx={{ pr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', mb: 0.5 }}>
                        {q.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                        {q.description || 'No description provided.'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={style.label}
                        sx={{
                          color: style.color,
                          bgcolor: style.bgcolor,
                          border: style.border,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                      <IconButton
                        size="small"
                        title="Delete Test"
                        onClick={() => setDeleteTargetId(q.id)}
                        sx={{
                          color: '#94A3B8',
                          '&:hover': { color: '#DC2626', bgcolor: '#FEE2E2' },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={2.5} sx={{ mt: 2.5, color: '#64748B' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <QuizRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        {qCount} Questions ({q.totalMarks || (qCount * 5)} Marks)
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <ScheduleRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        {q.durationMinutes} Mins Duration
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Typography sx={{ color: '#64748B', mb: 2, fontWeight: 500 }}>
            No assessments created yet. Click "Create New Test" to build your first quiz!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderColor: '#CBD5E1',
              color: '#334155',
            }}
          >
            Create New Test
          </Button>
        </Paper>
      )}

      {/* Create Test Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          },
        }}
      >
        <form onSubmit={handleCreateQuiz}>
          <DialogTitle sx={{ fontWeight: 700, color: '#0F172A', pb: 1 }}>
            Create New Auto-Graded Assessment
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Test Title"
                    placeholder="e.g., Dynamic Programming & Graph Theory Core"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Duration (Minutes)"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Description / Instructions"
                placeholder="Guidelines or syllabus covered in this assessment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />

              <Divider sx={{ my: 1, borderColor: '#E2E8F0' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Questions & Correct Answer Keys
              </Typography>

              {questions.map((q, qIndex) => (
                <Paper
                  key={qIndex}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#D97706' }}>
                        Question {qIndex + 1}
                      </Typography>
                      {questions.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#DC2626', bgcolor: '#FEE2E2' } }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={9}>
                        <TextField
                          label="Question Text"
                          placeholder="State the question clearly..."
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                          required
                          fullWidth
                          size="small"
                          sx={{ bgcolor: '#FFFFFF' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Points / Marks"
                          type="number"
                          value={q.points}
                          onChange={(e) => handleQuestionChange(qIndex, 'points', e.target.value)}
                          required
                          fullWidth
                          size="small"
                          sx={{ bgcolor: '#FFFFFF' }}
                        />
                      </Grid>
                    </Grid>

                    <FormControl component="fieldset">
                      <FormLabel component="legend" sx={{ fontSize: '0.85rem', mb: 1, color: '#475569', fontWeight: 600 }}>
                        Options — Click the radio button corresponding to the Correct Answer:
                      </FormLabel>
                      <RadioGroup
                        value={Number(q.correctOptionIndex)}
                        onChange={(e) => handleQuestionChange(qIndex, 'correctOptionIndex', Number(e.target.value))}
                      >
                        <Grid container spacing={1.5}>
                          {q.options.map((opt, oIndex) => {
                            const isCorrect = Number(q.correctOptionIndex) === oIndex;
                            return (
                              <Grid item xs={12} sm={6} key={oIndex}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 1,
                                    px: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: isCorrect ? '#86EFAC' : '#E2E8F0',
                                    bgcolor: isCorrect ? '#F0FDF4' : '#FFFFFF',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <FormControlLabel
                                      value={oIndex}
                                      control={
                                        <Radio
                                          size="small"
                                          sx={{
                                            color: '#94A3B8',
                                            '&.Mui-checked': { color: '#16A34A' },
                                          }}
                                        />
                                      }
                                      label=""
                                      sx={{ mr: 0 }}
                                    />
                                    <TextField
                                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                      value={opt}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                      required
                                      fullWidth
                                      size="small"
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: '#FFFFFF',
                                        },
                                      }}
                                    />
                                    {isCorrect && (
                                      <Chip
                                        size="small"
                                        label="Correct"
                                        sx={{
                                          height: 24,
                                          fontSize: '0.7rem',
                                          fontWeight: 700,
                                          bgcolor: '#DCFCE7',
                                          color: '#15803D',
                                          border: '1px solid #BBF7D0',
                                        }}
                                      />
                                    )}
                                  </Stack>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  </Stack>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddQuestion}
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#CBD5E1',
                  color: '#334155',
                }}
              >
                Add Another Question
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
              }}
            >
              {submitting ? 'Creating Test...' : 'Save & Publish Test'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Test Confirmation Modal */}
      <Dialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>
          Delete Assessment?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this test? All questions, student attempts, and automated evaluation reports will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTargetId(null)} disabled={deleting} sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteQuiz(deleteTargetId)}
            disabled={deleting}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            {deleting ? 'Deleting...' : 'Delete Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerQuizzesPage;
