const mongoose = require('mongoose');

const shortSchema = new mongoose.Schema({
  generated: {
    type: String,
    unique: true,
    required: [true, 'generated value is must!'],
  },
  link: {
    type: String,
    required: [true, 'the link is must!'],
    trim: true,
  },
  visitorsCount: Number,
  visitors: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Ip',
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

shortSchema.index({ generated: 1 }, { unique: true });

// shortSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'visitors',
//     select: 'country regionName createdAt',
//   });
//   next();
// });

const Short = mongoose.model('Short', shortSchema);

module.exports = Short;
