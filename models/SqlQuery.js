const mongoose = require('mongoose');

const SqlQuerySchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true
  },
  sqlCode: {
    type: String,
    required: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  executionTime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Success', 'Error'],
    default: 'Success'
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

module.exports = mongoose.model('SqlQuery', SqlQuerySchema);
