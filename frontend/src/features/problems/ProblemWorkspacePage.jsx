import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Stack,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Button,
  Tooltip,
  Divider,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import VerticalSplitRoundedIcon from '@mui/icons-material/VerticalSplitRounded';
import TextDecreaseRoundedIcon from '@mui/icons-material/TextDecreaseRounded';
import TextIncreaseRoundedIcon from '@mui/icons-material/TextIncreaseRounded';
import VerdictChip from '@/components/common/VerdictChip';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setLanguage, toggleTheme, setFontSize, toggleSplitScreen } from '@/features/editor/editorSlice';
import { defineMonacoThemes, LANGUAGE_BOILERPLATE, MONACO_LANGUAGE_ID } from './monacoConfig';
import { getProblemBySlug } from './mockProblems';
import problemService from '@/services/problemService';

const DIFFICULTY_STYLES = {
  Easy: { color: '#15803D', bgcolor: '#DCFCE7', border: '1px solid #BBF7D0' },
  Medium: { color: '#B45309', bgcolor: '#FEF3C7', border: '1px solid #FDE68A' },
  Hard: { color: '#B91C1C', bgcolor: '#FEE2E2', border: '1px solid #FECACA' },
};

const DEFAULT_PROBLEM = {
  title: 'Loading Problem...',
  difficulty: 'Easy',
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  description: '',
  examples: [],
  constraints: [],
  hints: [],
  tags: [],
};

const ProblemWorkspacePage = () => {
  const { slug } = useParams();
  const fallbackProblem = getProblemBySlug(slug) || DEFAULT_PROBLEM;
  const [problem, setProblem] = useState(fallbackProblem);
  const dispatch = useAppDispatch();
  const { language, monacoTheme, fontSize, splitScreen } = useAppSelector((s) => s.editor);

  const [code, setCode] = useState(LANGUAGE_BOILERPLATE[language] || '');
  const [leftTab, setLeftTab] = useState('description');
  const [consoleTab, setConsoleTab] = useState('input');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(null); // { verdict, stdout, runtimeMs, memoryKb }
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const workspaceRef = useRef(null);

  useEffect(() => {
    problemService
      .getBySlug(slug)
      .then((res) => {
        if (res.data) {
          setProblem({ ...DEFAULT_PROBLEM, ...res.data });
        }
      })
      .catch(() => {
        // Fallback to mock problem
        const mock = getProblemBySlug(slug);
        if (mock) setProblem(mock);
      });
  }, [slug]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    dispatch(setLanguage(lang));
    setCode(LANGUAGE_BOILERPLATE[lang]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      workspaceRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const runCode = async (isSubmit) => {
    setIsRunning(true);
    setConsoleTab('output');

    try {
      if (!isSubmit) {
        const res = await problemService.run(slug, { language, code, customInput });
        const data = res.data || res;
        setOutput({
          verdict: data.verdict || 'ACCEPTED',
          stdout: data.output || data.stderr || 'Code executed successfully with no output.',
          runtimeMs: data.runtimeMs || 0,
          memoryKb: data.memoryKb,
        });
      } else {
        const res = await problemService.submit(slug, { language, code });
        const data = res.data || res;
        setOutput({
          verdict: data.verdict || 'ACCEPTED',
          stdout: data.judgeOutput || `All test cases checked (${data.testCasesPassed ?? 0}/${data.testCasesTotal ?? 0} passed).`,
          runtimeMs: data.runtimeMs || 0,
          memoryKb: data.memoryKb,
        });
      }
    } catch (err) {
      setOutput({
        verdict: 'RUNTIME_ERROR',
        stdout: err.response?.data?.message || err.message || 'Failed to execute code.',
        runtimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const constraintsList = useMemo(() => {
    if (!problem?.constraints) return [];
    if (Array.isArray(problem.constraints)) return problem.constraints;
    if (typeof problem.constraints === 'string') {
      return problem.constraints.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [problem?.constraints]);

  const diffLabel = problem?.difficulty
    ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1).toLowerCase()
    : 'Easy';
  const diffStyle = DIFFICULTY_STYLES[diffLabel] || DIFFICULTY_STYLES.Easy;

  return (
    <Box
      ref={workspaceRef}
      sx={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 96px)',
        p: isFullscreen ? 2 : 0,
        bgcolor: isFullscreen ? '#F8FAFC' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.3rem' }}>
              {problem.title || 'Coding Problem'}
            </Typography>
            <Chip
              label={diffLabel}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 24,
                ...diffStyle,
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              Time Limit: {problem.timeLimitMs || 1000} ms
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              Memory Limit: {problem.memoryLimitMb || 256} MB
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<PlayArrowRoundedIcon />}
            onClick={() => runCode(false)}
            disabled={isRunning}
            sx={{
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              fontWeight: 600,
              textTransform: 'none',
              px: 2.5,
              '&:hover': {
                borderColor: '#94A3B8',
                bgcolor: '#F8FAFC',
              },
            }}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendRoundedIcon />}
            onClick={() => runCode(true)}
            disabled={isRunning}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
            }}
          >
            {isRunning ? 'Submitting...' : 'Submit Solution'}
          </Button>
        </Stack>
      </Stack>

      {/* Main Workspace Panels */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left: Problem Description Panel */}
        <Grid item xs={12} md={splitScreen ? 5 : 12} sx={{ height: { md: '100%' } }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
            }}
          >
            <Tabs
              value={leftTab}
              onChange={(_, v) => setLeftTab(v)}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                minHeight: 44,
                px: 1.5,
                bgcolor: '#FAFAFA',
                '& .MuiTab-root': {
                  minHeight: 44,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#64748B',
                  '&.Mui-selected': {
                    color: '#D97706',
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#F59E0B',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab value="description" label="Description" />
              <Tab value="hints" label={`Hints (${(problem.hints || []).length})`} />
              <Tab value="submissions" label="Submissions" />
            </Tabs>

            <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
              {leftTab === 'description' && (
                <>
                  <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, mb: 3, fontSize: '0.9375rem' }}>
                    {problem.description || 'No description provided.'}
                  </Typography>

                  {(problem.examples || []).length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#0F172A' }}>
                        Examples
                      </Typography>
                      <Stack spacing={2} sx={{ mb: 3 }}>
                        {problem.examples.map((ex, i) => (
                          <Paper
                            key={i}
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: '#F8FAFC',
                              borderRadius: 2,
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: '#475569',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 500,
                              }}
                            >
                              <strong style={{ color: '#0F172A' }}>Input:</strong> {ex.input}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: '#15803D',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                mt: 0.75,
                              }}
                            >
                              <strong style={{ color: '#0F172A' }}>Output:</strong> {ex.output}
                            </Typography>
                            {ex.explanation && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748B', lineHeight: 1.5 }}>
                                <strong style={{ color: '#0F172A' }}>Explanation:</strong> {ex.explanation}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  )}

                  {constraintsList.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#0F172A' }}>
                        Constraints
                      </Typography>
                      <Stack component="ul" sx={{ pl: 2.5, m: 0 }} spacing={0.75}>
                        {constraintsList.map((c, i) => (
                          <Typography
                            component="li"
                            key={i}
                            variant="caption"
                            sx={{
                              color: '#475569',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.8125rem',
                            }}
                          >
                            {c}
                          </Typography>
                        ))}
                      </Stack>
                    </>
                  )}

                  {(problem.tags || []).length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 3, pt: 2, borderTop: '1px solid #F1F5F9' }}>
                      {problem.tags.map((t) => (
                        <Chip
                          key={t}
                          size="small"
                          label={t}
                          sx={{
                            bgcolor: '#F1F5F9',
                            color: '#475569',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: 1,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </>
              )}

              {leftTab === 'hints' && (
                <Stack spacing={1.5}>
                  {(problem.hints || []).length > 0 ? (
                    problem.hints.map((h, i) => (
                      <Paper
                        key={i}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400E', mb: 0.5 }}>
                          Hint {i + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.6 }}>
                          {h}
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#64748B', py: 2 }}>
                      No hints provided for this problem. You've got this!
                    </Typography>
                  )}
                </Stack>
              )}

              {leftTab === 'submissions' && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    No previous submissions recorded in this session. Submit your code to see history and analytics here.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Code Editor + Console Panel */}
        {splitScreen && (
          <Grid item xs={12} md={7} sx={{ height: { md: '100%' } }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
              }}
            >
              {/* Editor Toolbar */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid #E2E8F0',
                  bgcolor: '#FAFAFA',
                }}
              >
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    height: 32,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                  }}
                >
                  <MenuItem value="java">Java 17</MenuItem>
                  <MenuItem value="python">Python 3.10</MenuItem>
                  <MenuItem value="cpp">C++ 20</MenuItem>
                  <MenuItem value="c">C (GCC)</MenuItem>
                  <MenuItem value="javascript">JavaScript (Node.js)</MenuItem>
                </Select>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title="Decrease font size">
                    <IconButton size="small" onClick={() => dispatch(setFontSize(Math.max(11, fontSize - 1)))} sx={{ color: '#64748B' }}>
                      <TextDecreaseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Increase font size">
                    <IconButton size="small" onClick={() => dispatch(setFontSize(Math.min(22, fontSize + 1)))} sx={{ color: '#64748B' }}>
                      <TextIncreaseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Toggle light/dark editor theme">
                    <IconButton size="small" onClick={() => dispatch(toggleTheme())} sx={{ color: '#64748B' }}>
                      {monacoTheme === 'ca-dark' ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Toggle split screen">
                    <IconButton size="small" onClick={() => dispatch(toggleSplitScreen())} sx={{ color: '#64748B' }}>
                      <VerticalSplitRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                    <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#64748B' }}>
                      {isFullscreen ? <FullscreenExitRoundedIcon fontSize="small" /> : <FullscreenRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* Monaco Editor Container */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Editor
                  height="100%"
                  language={MONACO_LANGUAGE_ID[language]}
                  theme={monacoTheme}
                  value={code}
                  onChange={(val) => setCode(val ?? '')}
                  beforeMount={defineMonacoThemes}
                  options={{
                    fontSize,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: { top: 16 },
                  }}
                />
              </Box>

              {/* Bottom Console Panel */}
              <Box
                sx={{
                  borderTop: '1px solid #E2E8F0',
                  height: 210,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: '#F8FAFC',
                }}
              >
                <Tabs
                  value={consoleTab}
                  onChange={(_, v) => setConsoleTab(v)}
                  sx={{
                    minHeight: 38,
                    px: 1.5,
                    borderBottom: '1px solid #E2E8F0',
                    bgcolor: '#FFFFFF',
                    '& .MuiTab-root': {
                      minHeight: 38,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: '#64748B',
                      '&.Mui-selected': { color: '#D97706' },
                    },
                    '& .MuiTabs-indicator': {
                      bgcolor: '#F59E0B',
                      height: 2.5,
                    },
                  }}
                >
                  <Tab value="input" label="Custom Input" />
                  <Tab
                    value="output"
                    label={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <span>Output Console</span>
                        {output && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: output.verdict === 'ACCEPTED' ? '#10B981' : '#EF4444',
                            }}
                          />
                        )}
                      </Stack>
                    }
                  />
                </Tabs>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {consoleTab === 'input' ? (
                    <Box
                      component="textarea"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input for the Run Code button (stdin)..."
                      sx={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 2,
                        p: 1.5,
                        outline: 'none',
                        color: '#0F172A',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8125rem',
                        '&:focus': {
                          borderColor: '#F59E0B',
                        },
                      }}
                    />
                  ) : (
                    <Box>
                      {isRunning && (
                        <Typography variant="body2" sx={{ color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          Executing code in isolated container...
                        </Typography>
                      )}
                      {!isRunning && output && (
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <VerdictChip verdict={output.verdict} />
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                              Runtime: {output.runtimeMs} ms
                              {output.memoryKb ? ` · Memory: ${(output.memoryKb / 1024).toFixed(1)} MB` : ''}
                            </Typography>
                          </Stack>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: 2,
                            }}
                          >
                            <Typography
                              component="pre"
                              sx={{
                                m: 0,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.8125rem',
                                color: output.verdict === 'ACCEPTED' ? '#0F172A' : '#B91C1C',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {output.stdout}
                            </Typography>
                          </Paper>
                        </Stack>
                      )}
                      {!isRunning && !output && (
                        <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                          Click "Run Code" or "Submit Solution" to execute your program and view the judge output here.
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProblemWorkspacePage;
