import { ApiResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Sanitize internal server errors in production to avoid leaking internal DB/code details
  const message =
    statusCode === 500 && isProduction
      ? 'An unexpected error occurred. Please contact atelier support.'
      : err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  return ApiResponse.error(
    res,
    message,
    statusCode,
    !isProduction ? { stack: err.stack } : null
  );
};

export const notFoundHandler = (req, res, next) => {
  return ApiResponse.error(res, `Route ${req.originalUrl} not found`, 404);
};
