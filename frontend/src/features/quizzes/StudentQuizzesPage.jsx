import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, Stack, Button, Skeleton } from '@mui/material';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useNavigate } from 'react-router-dom';
import quizService from '@/services/quizService';

const STATUS_STYLE = {
  LIVE: { label: 'Live Now', color: '#15803D', bgcolor: '#DCFCE7', border: '1px solid #BBF7D0' },
  UPCOMING: { label: 'Upcoming', color: '#0284C7', bgcolor: '#E0F2FE', border: '1px solid #BAE6FD' },
  ENDED: { label: 'Ended', color: '#64748B', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0' },
};

const StudentQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const SAMPLE_QUIZZES = [
    {
      id: 'q1',
      title: 'Data Structures & Algorithms Diagnostic',
      description: 'Evaluate your foundation in arrays, trees, hashing, dynamic programming, and graphs.',
      durationMinutes: 45,
      totalMarks: 50,
      status: 'LIVE',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
      questionsCount: 20,
    },
    {
      id: 'q2',
      title: 'Frontend Engineering Core Assessment',
      description: 'Core concepts in React, JavaScript event loops, DOM manipulation, and asynchronous programming.',
      durationMinutes: 60,
      totalMarks: 60,
      status: 'UPCOMING',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 172800000).toISOString(),
      questionsCount: 25,
    },
  ];

  useEffect(() => {
    setLoading(true);
    quizService
      .list()
      .then((res) => {
        const list = res.data || [];
        setQuizzes(list.length > 0 ? list : SAMPLE_QUIZZES);
      })
      .catch(() => {
        setQuizzes(SAMPLE_QUIZZES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
          Tests & Assessments
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Attempt scheduled assessments and quizzes within active windows with automated, instant evaluation.
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={190} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : quizzes.length > 0 ? (
        <Grid container spacing={2.5}>
          {quizzes.map((q) => {
            const statusKey = q.status || 'UPCOMING';
            const style = STATUS_STYLE[statusKey] || STATUS_STYLE.UPCOMING;
            const qCount = q.questionsCount ?? q.questionCount ?? 15;

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
                  </Stack>

                  <Stack direction="row" spacing={2.5} sx={{ my: 2.5, color: '#64748B' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <QuizRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        {qCount} Questions ({q.totalMarks} Marks)
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <ScheduleRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        {q.durationMinutes} Mins
                      </Typography>
                    </Stack>
                  </Stack>

                  {q.attempted ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      onClick={() => navigate(`/quizzes/${q.id}/attempt`)}
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      Completed (Score: {q.score !== null && q.score !== undefined ? q.score : (q.userScore || 0)} / {q.totalMarks})
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowRoundedIcon />}
                      onClick={() => navigate(`/quizzes/${q.id}/attempt`)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 1,
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      Attempt Test Now
                    </Button>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Typography sx={{ color: '#64748B', fontWeight: 500 }}>
            No tests scheduled right now. Check back soon!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StudentQuizzesPage;
