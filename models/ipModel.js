const mongoose = require('mongoose');

const ipShcema = new mongoose.Schema(
  {
    query: {
      type: String,
    },
    country: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    region: {
      type: String,
    },
    regionName: {
      type: String,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
    lat: {
      type: String,
    },
    lon: {
      type: String,
    },
    timezone: {
      type: String,
    },
    isp: {
      type: String,
    },
    org: {
      type: String,
    },
    as: {
      type: String,
    },
    short: {
      type: mongoose.Schema.ObjectId,
      ref: 'Short',
    },
    shortOwner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ipShcema.index({ query: 1, short: 1 }, { unique: true });

const Ip = mongoose.model('Ip', ipShcema);

module.exports = Ip;
