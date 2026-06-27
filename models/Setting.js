const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  animationSpeed: {
    type: String,
    enum: ['slow', 'normal', 'fast', 'disabled'],
    default: 'normal'
  },
  notifyAnalysis: {
    type: Boolean,
    default: true
  },
  notifyReport: {
    type: Boolean,
    default: true
  },
  notifyPrediction: {
    type: Boolean,
    default: true
  },
  activeApiKey: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Setting', SettingSchema);
