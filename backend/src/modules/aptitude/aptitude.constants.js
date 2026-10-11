// Shared constants for the Aptitude module.

const CATEGORIES = ['QUANTITATIVE', 'LOGICAL', 'VERBAL'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const CATEGORY_META = {
  QUANTITATIVE: {
    label: 'Quantitative Aptitude',
    description: 'Percentages, profit & loss, time & work, ratios, probability and number systems.',
  },
  LOGICAL: {
    label: 'Logical Reasoning',
    description: 'Number series, coding-decoding, syllogisms, blood relations and seating puzzles.',
  },
  VERBAL: {
    label: 'Verbal Ability',
    description: 'Vocabulary, grammar, error spotting, idioms and reading comprehension.',
  },
};

const SECONDS_PER_QUESTION = 60; // test duration = questionCount * this
const GRACE_SECONDS = 30; // network grace on top of the duration
const NEGATIVE_MARK = 0.25; // deducted per wrong answer when negative marking is on
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 30;

module.exports = {
  CATEGORIES,
  DIFFICULTIES,
  CATEGORY_META,
  SECONDS_PER_QUESTION,
  GRACE_SECONDS,
  NEGATIVE_MARK,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
};
