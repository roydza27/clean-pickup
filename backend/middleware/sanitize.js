/**
 * sanitize — strips HTML tags from all string fields in req.body, req.query, req.params.
 * Provides XSS defence at the API boundary.
 */
function stripHtml(value) {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripHtml);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = stripHtml(value[key]);
    }
    return cleaned;
  }
  return value;
}

function sanitize(req, res, next) {
  if (req.body)   req.body   = stripHtml(req.body);
  if (req.query)  req.query  = stripHtml(req.query);
  if (req.params) req.params = stripHtml(req.params);
  next();
}

module.exports = sanitize;
