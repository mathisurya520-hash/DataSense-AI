const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset'
  },
  chartsConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  insightsText: {
    type: String
  },
  predictionsConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);
