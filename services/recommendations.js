const dfd = require('danfojs');
const User = require('../models/User');

async function generateRecommendations(userId) {
  console.log('Generating recommendations for user:', userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      throw new Error('User not found');
    }

    console.log('User found:', user);

    if (!user.transactions || !Array.isArray(user.transactions)) {
      console.log('No transactions found for user');
      return [];
    }

    const transactions = user.transactions.filter(t => t.type === 'expense');
    console.log('Expense transactions:', transactions);

    if (transactions.length === 0) {
      console.log('No expense transactions found');
      return [];
    }

    // Group transactions by category and calculate total spent
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Determine the income bracket
    const annualIncome = user.income || 0;
    let savingsMultiplier;
    if (annualIncome < 200) {
      savingsMultiplier = 0.3; // Aggressive savings suggestions for low income
    } else if (annualIncome < 500) {
      savingsMultiplier = 0.2; // Moderate for mid-level income
    } else {
      savingsMultiplier = 0.1; // Less aggressive for higher income
    }

    // Filter out categories with less than $5 total spent
    const filteredCategories = Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 30)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    console.log('Top spending categories over $30:', filteredCategories);

    // Generate recommendations based on top spending categories and income
    const recommendations = filteredCategories.map(([category, amount]) => {
      let tip = '';
      let potentialSavings = 0;

      switch (category) {
        case 'Entertainment':
          tip = 'Look for free or low-cost activities, or consider sharing subscriptions.';
          potentialSavings = amount * savingsMultiplier * 0.5; // Heavier weight for low-income
          break;
        case 'Dining Out':
          tip = 'Consider meal prepping or limiting eating out to once a week.';
          potentialSavings = amount * savingsMultiplier * 0.4;
          break;
        case 'Clothing':
          tip = 'Shop at thrift stores or during sales, focusing on versatile items.';
          potentialSavings = amount * savingsMultiplier * 0.35;
          break;
        case 'Personal':
          tip = 'Try DIY for personal care or seek affordable alternatives.';
          potentialSavings = amount * savingsMultiplier * 0.3;
          break;
        default:
          tip = `Find ways to cut back in the ${category} category.`;
          potentialSavings = amount * savingsMultiplier * 0.25;
      }

      return {
        category,
        tip,
        potentialSavings: parseFloat(potentialSavings.toFixed(2)),
      };
    });

    console.log('Generated recommendations:', recommendations);
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = { generateRecommendations };
