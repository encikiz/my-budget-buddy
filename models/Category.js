const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['expense', 'income']
  },
  description: {
    type: String,
    default: ''
  },
  budgetLimit: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#3a56e4'
  },
  icon: {
    type: String,
    default: 'fas fa-tag'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', CategorySchema);
