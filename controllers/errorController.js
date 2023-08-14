const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorPro = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming or Unknown error, don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Somthing went wrong',
  });
};

const handleErrorCastDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateDB = (err) => {
  const message = `This ${Object.keys(err.keyValue)[0]} is aleady exist`;
  return new AppError(message, 400);
};

const handleValidationDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Ivalid token, please log in again', 401);

const handleTokenExpiredError = () =>
  new AppError('Your token has expired, please log in again', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    ///
    if (err.name === 'CastError') error = handleErrorCastDB(err);
    if (err.code === 11000) error = handleDuplicateDB(err);
    if (err.name === 'ValidationError') error = handleValidationDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError(err);
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError(err);
    sendErrorPro(error, req, res);
  }
};
