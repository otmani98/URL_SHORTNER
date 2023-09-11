const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure =
      req.secure || req.headers['x-forwarded-proto'] === 'https';
  }

  res.cookie('jwt', token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//this function for signup
const createConfirmTokenSendEmail = catchAsync(async (user, req, res, next) => {
  //Create token for confirmation
  const confirmationToken = user.createConfirmationToken();
  await user.save({ validateBeforeSave: false });

  //Send it to user's Email
  try {
    const confirmUrl = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/signup/${confirmationToken}`;

    await new Email(user, confirmUrl).sendConfirmation();
  } catch (err) {
    await user.deleteOne();

    return next(
      new AppError(
        'There was an error, please try to register again later',
        500,
      ),
    );
  }

  res.status(201).json({
    status: 'success',
    message:
      'You need to confirm your registeration, Please check your email box.',
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  //this for exist account and didn't confirm it yet
  const findaccount = await User.findOne({ email: email });
  if (findaccount && !findaccount.confirmed) {
    return createConfirmTokenSendEmail(findaccount, req, res, next);
  }
  //this for new account
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  createConfirmTokenSendEmail(user, req, res, next);
});

exports.confirmSignUp = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    confirmationToken: hashedToken,
    confirmationExpires: { $gt: Date.now() },
  });

  //if token has not expired, and there is user, confirm his account
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.confirmed = true;
  user.confirmationExpires = undefined;
  user.confirmationToken = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Please provide password & email', 400));

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.passwordCorrect(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  if (!user.confirmed)
    return next(
      new AppError(
        'You did not confirm your account yet, please check your email box',
        401,
      ),
    );

  //if everything is ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //Getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, Please log in to get access', 401),
    );
  }

  //Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user blonging to this token does no longer exist', 401),
    );
  }

  //check if user changed his password
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, Please log in again', 401),
    );
  }

  //Garant access to protected Route and save user info in req
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //Getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next();
  }

  //Verification token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch {
    return next();
  }
  // console.log(decoded);

  //check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next();
  }

  //check if user changed his password
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next();
  }

  //Garant access to protected Route and save user info in req
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user Posted in user email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('there is no user with this email', 404));
  }

  if (!user.active)
    return next(new AppError('This account has been deleted', 401));

  //Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //Send it to user's Email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExipres = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, Try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExipres: { $gt: Date.now() },
  });

  //If token has not expired, and there is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExipres = undefined;

  await user.save();

  if (!user.confirmed)
    return next(
      new AppError(
        'You did not confirm your account yet, please check your email box',
        401,
      ),
    );

  //Log the user in
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get userfrom collection
  const user = await User.findById(req.user.id).select('+password');

  //Check if posted current password is correct
  if (!(await user.passwordCorrect(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your password is not correct', 401));
  }

  //If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Log user in, and send JWT
  createSendToken(user, 200, req, res);
});
