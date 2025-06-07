const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { generateRecommendations } = require('../services/recommendations'); // Import the recommendations function

// Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ msg: 'Please enter a valid email' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }
  
  next();
};

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', validateRegisterInput, async (req, res) => {
  const { email, password } = req.body;
  
  // Convert email to lowercase for consistency
  const normalizedEmail = email.toLowerCase();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email: normalizedEmail,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Convert email to lowercase for consistency
  const normalizedEmail = email.toLowerCase();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
// @route   POST api/users/transaction
// @desc    Add a new transaction
// @access  Private
router.post('/transaction', auth, async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  try {
    const user = await User.findById(req.user.id);
    user.transactions.push({ type, amount, category, description, date });
    await user.save();
    res.json(user.transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/transactions
// @desc    Get user's transactions
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/transaction/:id
// @desc    Update a transaction
// @access  Private
router.put('/transaction/:id', auth, async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const transactionIndex = user.transactions.findIndex(t => t._id.toString() === req.params.id);

    if (transactionIndex === -1) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    user.transactions[transactionIndex] = { ...user.transactions[transactionIndex], type, amount, category, description, date };
    await user.save();
    res.json(user.transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/transaction/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/transaction/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.transactions = user.transactions.filter(t => t._id.toString() !== req.params.id);
    await user.save();
    res.json(user.transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/recommendations
// @desc    Get money-saving recommendations for the user
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  console.log('Recommendations route hit');
  console.log('User ID from token:', req.user.id);
  try {
    const recommendations = await generateRecommendations(req.user.id);
    console.log('Recommendations generated:', recommendations);
    res.json(recommendations);
  } catch (err) {
    console.error('Error in recommendations route:', err);
    if (err.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET api/users/budgets
// @desc    Get user's budgets
// @access  Private
router.get('/budgets', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Convert Map to object for easier frontend handling
    const budgets = user.budgets ? Object.fromEntries(user.budgets) : {
      Food: 300,
      Transportation: 200,
      Entertainment: 150,
      Clothing: 100,
      Personal: 100,
      Misc: 50
    };
    
    res.json({ 
      budgets,
      startDate: user.budgetStartDate,
      endDate: user.budgetEndDate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/budgets
// @desc    Update user's budgets
// @access  Private
router.put('/budgets', auth, async (req, res) => {
  try {
    const { budgets, startDate, endDate } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update budgets
    user.budgets = new Map(Object.entries(budgets));
    
    // Update date range if provided
    if (startDate) user.budgetStartDate = new Date(startDate);
    if (endDate) user.budgetEndDate = new Date(endDate);
    
    await user.save();
    
    res.json({ 
      budgets: Object.fromEntries(user.budgets),
      startDate: user.budgetStartDate,
      endDate: user.budgetEndDate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/budgets/reset
// @desc    Reset budgets to defaults
// @access  Private
router.delete('/budgets/reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Reset to default budgets and dates
    user.budgets = new Map([
      ['Food', 300],
      ['Transportation', 200],
      ['Entertainment', 150],
      ['Clothing', 100],
      ['Personal', 100],
      ['Misc', 50]
    ]);
    
    // Reset to current month
    const now = new Date();
    user.budgetStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    user.budgetEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    await user.save();
    
    res.json({ 
      msg: 'Budgets reset to defaults',
      budgets: Object.fromEntries(user.budgets),
      startDate: user.budgetStartDate,
      endDate: user.budgetEndDate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
