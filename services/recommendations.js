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

    // Filter out categories with less than $20 total spent
    const filteredCategories = Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 20)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    console.log('Top spending categories over $20:', filteredCategories);

    // Generate recommendations based on top spending categories
    const recommendations = filteredCategories.map(([category, amount]) => {
      let tip = '';
      let potentialSavings = 0;

      switch (category) {
        case 'Entertainment':
          tip = 'Look for free or low-cost entertainment options in your area, or consider sharing streaming subscriptions with friends or family.';
          potentialSavings = amount * 0.3;
          break;
        case 'Clothing':
          tip = 'Try shopping at thrift stores or during sales, and focus on versatile, quality pieces that last longer.';
          potentialSavings = amount * 0.4;
          break;
        case 'Personal':
          tip = 'Look for ways to reduce personal care costs, such as DIY treatments or finding more affordable alternatives.';
          potentialSavings = amount * 0.2;
          break;
        case 'Transportation':
          tip = 'Consider carpooling, using public transit, or biking for short trips to reduce transportation costs.';
          potentialSavings = amount * 0.25;
          break;
        case 'Misc':
          tip = 'Review your miscellaneous expenses and identify any non-essential items you can cut back on.';
          potentialSavings = amount * 0.3;
          break;
        default:
          tip = `Look for ways to reduce your spending in the ${category} category.`;
          potentialSavings = amount * 0.2;
      }

      return {
        category,
        tip,
        potentialSavings,
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
