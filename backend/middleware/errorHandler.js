const errorHandler = (err, req, res, next) => {
  console.error('خطا:', err);

  let error = { ...err };
  error.message = err.message;

  // خطای Mongoose - شناسه نامعتبر
  if (err.name === 'CastError') {
    error.message = 'شناسه نامعتبر است';
    error.statusCode = 400;
  }

  // خطای Mongoose - تکراری
  if (err.code === 11000) {
    error.message = 'این مقدار قبلاً ثبت شده است';
    error.statusCode = 400;
  }

  // خطای Mongoose - اعتبارسنجی
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'خطای سرور',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;