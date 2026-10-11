import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Radio,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import aptitudeService from '@/services/aptitudeService';
import {
  CATEGORY_KEYS,
  DIFFICULTY_KEYS,
  LETTERS,
  categoryUi,
  difficultyUi,
  getErrorMessage,
} from '@/features/aptitude/aptitudeUi';

const EMPTY_FORM = {
  category: 'QUANTITATIVE',
  topic: '',
  difficulty: 'EASY',
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  fixedOrder: false,
};

const BULK_EXAMPLE = `[
  {
    "category": "QUANTITATIVE",
    "topic": "Percentages",
    "difficulty": "EASY",
    "question": "What is 10% of 200?",
    "options": ["10", "20", "30", "40"],
    "correctIndex": 1,
    "explanation": "10% of 200 = 200 x 10 / 100 = 20."
  }
]`;

// ───────────────────────── add / edit dialog ─────────────────────────

const QuestionDialog = ({ question, onClose, onSaved }) => {
  const editing = Boolean(question);
  const [form, setForm] = useState(
    question
      ? {
          category: question.category,
          topic: question.topic,
          difficulty: question.difficulty,
          question: question.question,
          options: [...question.options],
          correctIndex: question.correctIndex,
          explanation: question.explanation || '',
          fixedOrder: question.fixedOrder,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setOption = (index, value) => set({ options: form.options.map((o, i) => (i === index ? value : o)) });
  const addOption = () => set({ options: [...form.options, ''] });
  const removeOption = (index) => {
    const options = form.options.filter((_, i) => i !== index);
    let correctIndex = form.correctIndex;
    if (index === correctIndex) correctIndex = 0;
    else if (index < correctIndex) correctIndex -= 1;
    set({ options, correctIndex });
  };

  const validate = () => {
    if (form.topic.trim().length < 2) return 'Please enter a topic (e.g. Percentages).';
    if (form.question.trim().length < 5) return 'Please enter the question text.';
    const trimmed = form.options.map((o) => o.trim());
    if (trimmed.some((o) => !o)) return 'Fill in every option, or remove the empty ones.';
    if (new Set(trimmed.map((o) => o.toLowerCase())).size !== trimmed.length) return 'Options must be different from each other.';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      topic: form.topic.trim(),
      question: form.question.trim(),
      options: form.options.map((o) => o.trim()),
      explanation: form.explanation.trim(),
    };
    try {
      if (editing) await aptitudeService.updateQuestion(question.id, payload);
      else await aptitudeService.createQuestion(payload);
      onSaved(editing ? 'Question updated.' : 'Question added.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the question.'));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>{editing ? 'Edit question' : 'Add aptitude question'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select size="small" label="Category" value={form.category} onChange={(e) => set({ category: e.target.value })} fullWidth>
              {CATEGORY_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {categoryUi(key).label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Difficulty" value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value })} fullWidth>
              {DIFFICULTY_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {difficultyUi(key).label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField size="small" label="Topic" placeholder="e.g. Percentages, Syllogisms, Idioms" value={form.topic} onChange={(e) => set({ topic: e.target.value })} slotProps={{ htmlInput: { maxLength: 60 } }} fullWidth />

          <TextField label="Question" value={form.question} onChange={(e) => set({ question: e.target.value })} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 2000 } }} fullWidth />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Options — select the radio button next to the correct answer
            </Typography>
            <Stack spacing={1} sx={{ mt: 0.75 }}>
              {form.options.map((option, index) => (
                <Stack key={index} direction="row" spacing={0.5} alignItems="center">
                  <Radio
                    checked={form.correctIndex === index}
                    onChange={() => set({ correctIndex: index })}
                    color="success"
                    slotProps={{ input: { 'aria-label': `Option ${LETTERS[index]} is the correct answer` } }}
                  />
                  <TextField size="small" placeholder={`Option ${LETTERS[index]}`} value={option} onChange={(e) => setOption(index, e.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} fullWidth />
                  <IconButton size="small" onClick={() => removeOption(index)} disabled={form.options.length <= 2} aria-label={`Remove option ${LETTERS[index]}`}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            {form.options.length < 6 && (
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addOption} sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}>
                Add option
              </Button>
            )}
          </Box>

          <TextField label="Explanation (shown after the test)" value={form.explanation} onChange={(e) => set({ explanation: e.target.value })} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 3000 } }} fullWidth />

          <FormControlLabel
            control={<Checkbox checked={form.fixedOrder} onChange={(e) => set({ fixedOrder: e.target.checked })} />}
            label={
              <Typography variant="body2">
                Keep options in this order <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>(turn on for “All of the above”, “A and B”, etc.)</Typography>
              </Typography>
            }
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add question'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ───────────────────────── bulk import dialog ─────────────────────────

// Turns the server's "questions.3.topic" style keys into "Question 4 — topic: message".
const describeBulkErrors = (err) => {
  const fieldErrors = err?.response?.data?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return [getErrorMessage(err, 'Import failed.')];
  return Object.entries(fieldErrors)
    .slice(0, 8)
    .map(([path, message]) => {
      const m = path.match(/^questions\.(\d+)\.?(.*)$/);
      return m ? `Question ${Number(m[1]) + 1}${m[2] ? ` — ${m[2]}` : ''}: ${message}` : `${path}: ${message}`;
    });
};

const BulkDialog = ({ onClose, onImported }) => {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleImport = async () => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setErrors(['That is not valid JSON. Check for missing commas or quotes.']);
      return;
    }
    const questions = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      setErrors(['Provide a JSON array of questions (see the example).']);
      return;
    }
    setImporting(true);
    setErrors([]);
    try {
      const res = await aptitudeService.bulkCreate(questions);
      onImported(res.message || `${res.data.created} question(s) imported.`);
    } catch (err) {
      setErrors(describeBulkErrors(err));
      setImporting(false);
    }
  };

  return (
    <Dialog open onClose={importing ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>Bulk import questions</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Paste a JSON array (up to 200 questions). <strong>correctIndex</strong> is zero-based: 0 = first option, 1 = second, and so on.
          Questions that already exist in the same category are skipped.
        </DialogContentText>
        <TextField
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={BULK_EXAMPLE}
          multiline
          minRows={12}
          maxRows={20}
          fullWidth
          slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' } } }}
        />
        <Button size="small" onClick={() => setText(BULK_EXAMPLE)} sx={{ textTransform: 'none', fontWeight: 600, mt: 1 }}>
          Fill with example
        </Button>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {errors.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={importing} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={handleImport} disabled={importing || !text.trim()} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          {importing ? 'Importing…' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ───────────────────────── page ─────────────────────────

const AdminAptitudePage = () => {
  const [filters, setFilters] = useState({ category: '', difficulty: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | question object
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    aptitudeService
      .listQuestions({ category: filters.category || undefined, difficulty: filters.difficulty || undefined, search: search || undefined, page, limit: 10 })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load questions.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, search, page, reloadKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const changeFilter = (patch) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleSaved = (message) => {
    setEditing(null);
    setBulkOpen(false);
    setNotice(message);
    refresh();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await aptitudeService.deleteQuestion(toDelete.id);
      setToDelete(null);
      setNotice('Question removed.');
      refresh();
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Could not remove the question.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.6rem', mb: 0.5 }}>
            Aptitude question bank
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Questions here power the students&apos; aptitude practice tests. Options are shuffled for every student automatically.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setBulkOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Bulk import
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Add question
          </Button>
        </Stack>
      </Stack>

      {notice && (
        <Alert severity="success" onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      {data && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {CATEGORY_KEYS.map((key) => {
            const ui = categoryUi(key);
            return <Chip key={key} label={`${ui.short}: ${data.summary[key] ?? 0}`} sx={{ bgcolor: ui.bg, color: ui.color, fontWeight: 700 }} />;
          })}
        </Stack>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            placeholder="Search question text or topic"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField select size="small" label="Category" value={filters.category} onChange={(e) => changeFilter({ category: e.target.value })} sx={{ minWidth: 190 }}>
            <MenuItem value="">All categories</MenuItem>
            {CATEGORY_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                {categoryUi(key).label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Difficulty" value={filters.difficulty} onChange={(e) => changeFilter({ difficulty: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="">All levels</MenuItem>
            {DIFFICULTY_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                {difficultyUi(key).label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : (
        <Stack spacing={1.5} sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
          {data && data.items.length > 0 ? (
            data.items.map((item) => {
              const cui = categoryUi(item.category);
              const dui = difficultyUi(item.difficulty);
              return (
                <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      <Chip size="small" label={cui.short} sx={{ bgcolor: cui.bg, color: cui.color, fontWeight: 700, height: 22 }} />
                      <Chip size="small" label={dui.label} sx={{ bgcolor: dui.bg, color: dui.color, fontWeight: 700, height: 22 }} />
                      <Chip size="small" variant="outlined" label={item.topic} sx={{ height: 22, fontWeight: 600 }} />
                      {item.builtIn && <Chip size="small" label="Built-in" sx={{ height: 22, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />}
                      {item.fixedOrder && <Chip size="small" label="Fixed order" sx={{ height: 22, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />}
                    </Stack>
                    <Typography
                      sx={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.question}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#15803D', mt: 0.5 }}>
                      Answer: {LETTERS[item.correctIndex]}. {item.options[item.correctIndex]}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={item.canEdit ? 'Edit' : 'Only an admin or the person who created it can edit this'}>
                      <span>
                        <IconButton size="small" disabled={!item.canEdit} onClick={() => setEditing(item)} aria-label="Edit question">
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={item.canEdit ? 'Remove' : 'Only an admin or the person who created it can remove this'}>
                      <span>
                        <IconButton size="small" disabled={!item.canEdit} onClick={() => { setDeleteError(null); setToDelete(item); }} aria-label="Remove question" sx={{ color: item.canEdit ? '#DC2626' : undefined }}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              );
            })
          ) : (
            <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography sx={{ color: 'text.secondary' }}>No questions match these filters.</Typography>
            </Paper>
          )}
        </Stack>
      )}

      {data && data.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data.pages}
            page={page}
            onChange={(_, value) => {
              setLoading(true);
              setPage(value);
            }}
            shape="rounded"
          />
        </Box>
      )}

      {editing && (
        <QuestionDialog question={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {bulkOpen && <BulkDialog onClose={() => setBulkOpen(false)} onImported={handleSaved} />}

      <Dialog open={Boolean(toDelete)} onClose={deleting ? undefined : () => setToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Remove this question?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            It will no longer appear in new tests. Students who already took a test containing it will still see it in their review.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setToDelete(null)} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAptitudePage;
