import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import SpellcheckRoundedIcon from '@mui/icons-material/SpellcheckRounded';
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded';

// Shared look-and-feel helpers for the Aptitude pages.

export const CATEGORY_UI = {
  QUANTITATIVE: { label: 'Quantitative Aptitude', short: 'Quantitative', icon: CalculateRoundedIcon, color: '#D97706', bg: '#FEF3C7' },
  LOGICAL: { label: 'Logical Reasoning', short: 'Logical', icon: PsychologyRoundedIcon, color: '#6D28D9', bg: '#EDE9FE' },
  VERBAL: { label: 'Verbal Ability', short: 'Verbal', icon: SpellcheckRoundedIcon, color: '#0284C7', bg: '#E0F2FE' },
  MIXED: { label: 'Mixed Practice', short: 'Mixed', icon: ShuffleRoundedIcon, color: '#15803D', bg: '#DCFCE7' },
};

export const DIFFICULTY_UI = {
  EASY: { label: 'Easy', color: '#15803D', bg: '#DCFCE7' },
  MEDIUM: { label: 'Medium', color: '#B45309', bg: '#FEF3C7' },
  HARD: { label: 'Hard', color: '#B91C1C', bg: '#FEE2E2' },
  ANY: { label: 'Any level', color: '#475569', bg: '#F1F5F9' },
};

export const CATEGORY_KEYS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL'];
export const DIFFICULTY_KEYS = ['EASY', 'MEDIUM', 'HARD'];

export const categoryUi = (key) => CATEGORY_UI[key] || CATEGORY_UI.MIXED;
export const difficultyUi = (key) => DIFFICULTY_UI[key] || DIFFICULTY_UI.ANY;

// 125 -> "2:05"
export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

// 125 -> "2m 5s"
export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest}s`;
  return rest === 0 ? `${m}m` : `${m}m ${rest}s`;
};

export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const accuracyColor = (pct) => {
  if (pct >= 70) return { color: '#15803D', bg: '#DCFCE7' };
  if (pct >= 40) return { color: '#B45309', bg: '#FEF3C7' };
  return { color: '#B91C1C', bg: '#FEE2E2' };
};

// Pulls a readable message out of our API error envelope.
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data;
  if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
    const first = Object.values(data.fieldErrors)[0];
    if (first) return String(first);
  }
  return data?.message || fallback;
};

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
