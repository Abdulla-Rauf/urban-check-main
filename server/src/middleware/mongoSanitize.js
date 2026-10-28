/**
 * NoSQL Query Injection Sanitization Middleware
 * Recursively strips object keys that begin with '$' or contain '.'
 * to prevent MongoDB operator injection across req.body, req.query, and req.params.
 */

function sanitize(obj, depth = 0) {
  if (depth > 15) return obj; // Prevent circular reference stack overflows
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block Mongo operators starting with '$' and dot-notation property traversal
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[Security Alert] Stripped potentially unsafe NoSQL injection key: "${key}"`);
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const mongoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};
