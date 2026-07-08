const multer = require("multer");

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || "Internal server error"
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production" && err.stack) payload.stack = err.stack;

  return res.status(statusCode).json(payload);
}

module.exports = {
  notFound,
  errorHandler
};
