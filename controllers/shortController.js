const axios = require('axios');
const requestIp = require('request-ip');
const mongoose = require('mongoose');
const Short = require('../models/shortModel');
const Ip = require('../models/ipModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const randomString = (length) => {
  const allValues =
    '0123456789qwertyuiopljhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM';
  let randomValue = '';
  for (let i = 0; i < length; i++) {
    randomValue += allValues[Math.floor(Math.random() * (60 - 0 + 1)) + 0];
  }
  return randomValue;
};

exports.getShorts = catchAsync(async (req, res, next) => {
  const shorts = await Short.find({ user: req.user.id }).select('-visitors');

  res.status(200).json({
    status: 'success',
    length: shorts.length,
    data: {
      yourShorts: shorts,
    },
  });
});

exports.getStat = catchAsync(async (req, res, next) => {
  const agg = await Ip.aggregate([
    { $match: { shortOwner: req.user._id } },

    {
      $group: {
        _id: '$country',
        numberOfVisitors: { $sum: 1 },
      },
    },
    {
      $sort: { numberOfVisitors: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    length: agg.length,
    data: agg,
  });
});

exports.getStatShort = catchAsync(async (req, res, next) => {
  const shortId = new mongoose.Types.ObjectId(req.params.shortId);
  const agg = await Ip.aggregate([
    {
      $match: {
        shortOwner: req.user._id,
        short: shortId,
      },
    },

    {
      $group: {
        _id: '$country',
        numberOfVisitors: { $sum: 1 },
      },
    },
    {
      $sort: { numberOfVisitors: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    length: agg.length,
    data: agg,
  });
});

exports.createShort = catchAsync(async (req, res, next) => {
  const userId = req.user ? req.user.id : undefined;
  const short = await Short.create({
    generated: randomString(7),
    link: req.body.link,
    user: userId,
  });

  res.status(201).json({
    status: 'success',
    data: {
      short,
    },
  });
});

exports.goLink = catchAsync(async (req, res, next) => {
  const short = await Short.findOne({ generated: req.params.generated });

  if (!short)
    return next(new AppError('There is no short link like this', 404));

  // Get ip information
  const info = await axios.get(
    `http://ip-api.com/json/${requestIp.getClientIp(req)}`,
  );

  // if there any info then add (short & user) id to ip object
  if (info.data.status === 'success') {
    info.data.short = short.id;
    info.data.shortOwner = short.user;
    // if there the same ip and short then ignore with this try and catch
    try {
      const ip = await Ip.create(info.data);
      short.visitors.push(ip.id);
      short.visitorsCount = short.visitors.length;
      await short.save();
    } catch {
      //with this try and catch we avoid mongoDB duplicate error
    } finally {
      res.redirect(short.link);
    }
  } else {
    res.redirect(short.link);
  }
});

exports.deleteShort = catchAsync(async (req, res, next) => {
  const short = await Short.findOneAndDelete({
    generated: req.params.generated,
    user: req.user.id,
  });
  //ckeck if short link belong to this user
  if (!short) {
    return next(new AppError('This short url does not belong to you', 403));
  }

  await Ip.deleteMany({ short: short.id, shortOwner: req.user.id });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
