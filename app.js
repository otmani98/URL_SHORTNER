const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const shortRouter = require('./routes/shortRouter');
const userRouter = require('./routes/userRouter');

const app = express();

app.enable('trust proxy');

//1 GLOBAL MIDDLWARES

//Implement CORS
app.use(cors());
app.options('*', cors());

//Implement helmet to set http headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//BODY parser
app.use(express.json({ limit: '20kb' }));
//COOKIE parser
app.use(cookieParser());

//Protect from NO-SQL query injection
app.use(mongoSanitize());

//Protect from xss
app.use(xss());

app.use(compression());

//2ROUTES
app.use('/api/v1/shorts', shortRouter);
app.use('/api/v1/users', userRouter);

//Dealing with any router doesn't exist
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

//Global error handler
app.use(errorController);

module.exports = app;
