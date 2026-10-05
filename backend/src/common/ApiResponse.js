/**
 * Uniform success envelope, mirrors the Java record ApiResponse<T>.
 * Every successful response looks like:
 *   { success: true, data: <T|null>, message: <string|null>, timestamp }
 */
function ok(data, message) {
  const body = { success: true, timestamp: new Date().toISOString() };
  if (data !== undefined && data !== null) body.data = data;
  if (message) body.message = message;
  return body;
}

function message(msg) {
  return { success: true, message: msg, timestamp: new Date().toISOString() };
}

module.exports = { ok, message };
