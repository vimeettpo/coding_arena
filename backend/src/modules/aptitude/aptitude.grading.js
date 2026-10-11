const { NEGATIVE_MARK } = require('./aptitude.constants');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Pure grading function (no DB access) so it can be unit-tested.
 *
 * @param {Array<{id:string, category:string, topic:string, options:string[], correctIndex:number}>} questions
 *        questions in the order they were served
 * @param {Map<string, number|null>} answerMap questionId -> selected option index (or null/undefined = skipped)
 * @param {boolean} negativeMarking
 */
function gradeAttempt(questions, answerMap, negativeMarking) {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const byTopic = new Map();
  const byCategory = new Map();
  const answers = [];

  const bump = (map, key, isCorrect) => {
    const row = map.get(key) || { correct: 0, total: 0 };
    row.total += 1;
    if (isCorrect) row.correct += 1;
    map.set(key, row);
  };

  for (const q of questions) {
    const raw = answerMap.get(q.id);
    const valid = Number.isInteger(raw) && raw >= 0 && raw < q.options.length;
    const selectedIndex = valid ? raw : null;
    const isCorrect = valid && selectedIndex === q.correctIndex;

    if (!valid) unanswered += 1;
    else if (isCorrect) correct += 1;
    else incorrect += 1;

    bump(byTopic, q.topic, isCorrect);
    bump(byCategory, q.category, isCorrect);
    answers.push({ questionId: q.id, selectedIndex });
  }

  const total = questions.length;
  const penalty = negativeMarking ? incorrect * NEGATIVE_MARK : 0;
  const score = Math.max(0, round2(correct - penalty));
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    answers,
    correct,
    incorrect,
    unanswered,
    total,
    score,
    totalMarks: total,
    accuracy,
    topicBreakdown: [...byTopic.entries()].map(([topic, v]) => ({ topic, ...v })),
    categoryBreakdown: [...byCategory.entries()].map(([category, v]) => ({ category, ...v })),
  };
}

module.exports = { gradeAttempt, round2 };
