/**
 * Exact match -> ACCEPTED. Same content but differing only in surrounding/
 * trailing whitespace -> PRESENTATION_ERROR (a deliberately distinct
 * verdict, so students learn to match output formatting exactly rather
 * than being silently marked wrong). Anything else -> WRONG_ANSWER.
 * Mirrors OutputComparator.java.
 */
function normalize(s) {
  return (s || '').trim().replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '');
}

function compare(actual, expected) {
  const actualExact = actual || '';
  const expectedExact = expected || '';

  if (actualExact === expectedExact) return 'ACCEPTED';
  if (normalize(actualExact) === normalize(expectedExact)) return 'PRESENTATION_ERROR';
  return 'WRONG_ANSWER';
}

module.exports = { compare };
