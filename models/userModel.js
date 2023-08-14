const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //it only works with create and save not update
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExipres: Date,
  active: {
    type: Boolean,
    default: true,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  confirmationToken: String,
  confirmationExpires: Date,
});

//hashing the new password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

//to create the date that the password is changed
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//check if password is correct when trying to login
userSchema.methods.passwordCorrect = async function (
  cndidatePassword,
  userPassword,
) {
  return await bcrypt.compare(cndidatePassword, userPassword);
};

//check if password changed after logged in
userSchema.methods.changedPasswordAfter = function (JwtTimesStamp) {
  if (this.passwordChangedAt) {
    const changedStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JwtTimesStamp < changedStamp;
  }
  //Means not changed
  return false;
};

//create token to resetpassword
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExipres = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//create confirmation token
userSchema.methods.createConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.confirmationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.confirmationExpires = Date.now() + 8 * 60 * 60 * 1000;

  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
