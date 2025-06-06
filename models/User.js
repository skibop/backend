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
budgetStartDate: {
  type: Date,
  default: function() {
    // Default to first day of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
},
budgetEndDate: {
  type: Date,
  default: function() {
    // Default to last day of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
}
});

module.exports = mongoose.model('User', UserSchema);
