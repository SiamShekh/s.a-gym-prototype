export const errorHandler = (err, req, res, next) => {
  // Yup validation
  if (err.name === 'ValidationError' && Array.isArray(err.inner)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.inner.map((e) => ({
        path: e.path,
        message: e.message,
      })),
    });
  }

  // Mongoose validation
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({
        path: e.path,
        message: e.message,
      })),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || 'id'}`,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' &&
      status === 500 && { stack: err.stack }),
  });
};
