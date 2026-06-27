const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  headers: {
    type: [String],
    required: true
  },
  rows: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  columnsCount: {
    type: Number,
    required: true
  },
  rowsCount: {
    type: Number,
    required: true
  },
  qualityScore: {
    type: Number,
    default: 100
  },
  missingValuesCount: {
    type: Number,
    default: 0
  },
  duplicatesCount: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Dataset', DatasetSchema);
