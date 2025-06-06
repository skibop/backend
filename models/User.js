const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  transactions: [{
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  budgets: {
  monthly: {
    type: Map,
    of: Number,
    default: new Map([
      ['Food', 300],
      ['Transportation', 200],
      ['Entertainment', 150],
      ['Clothing', 100],
      ['Personal', 100],
      ['Misc', 50]
    ])
  },
  weekly: {
    type: Map,
    of: Number,
    default: new Map([
      ['Food', 75],
      ['Transportation', 50],
      ['Entertainment', 40],
      ['Clothing', 25],
      ['Personal', 25],
      ['Misc', 15]
    ])
  },
  yearly: {
    type: Map,
    of: Number,
    default: new Map([
      ['Food', 3600],
      ['Transportation', 2400],
      ['Entertainment', 1800],
      ['Clothing', 1200],
      ['Personal', 1200],
      ['Misc', 600]
    ])
  }
}
});

module.exports = mongoose.model('User', UserSchema);
