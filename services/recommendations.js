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

    const income = user.income || 0;
    const baseSavingsMultiplier = 0.2; // Default savings multiplier for moderate income
    let savingsMultiplier;

    // Adjust the multiplier based on income (lower income = more aggressive savings suggestions)
    if (income <= 200) {
      savingsMultiplier = 0.4; // Aggressive savings for users with low income
    } else if (income <= 500) {
      savingsMultiplier = 0.3; // Moderate savings for mid-level income
    } else {
      savingsMultiplier = baseSavingsMultiplier; // Less aggressive for higher income
    }

    // Calculate potential savings for each category
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Filter and sort categories based on total spending, set higher minimum threshold
    const filteredCategories = Object.entries(categoryTotals)
      .filter(([category, amount]) => amount > 25)  // Set a higher minimum threshold (e.g., $50)
      .sort((a, b) => b[1] - a[1]); // Sort by highest spending

    // Generate recommendations based on spending categories and income
    const recommendations = filteredCategories.map(([category, amount]) => {
      let tip = '';
      let potentialSavings = amount * savingsMultiplier; // Apply income-based savings multiplier

      switch (category) {
        case 'Transportation':
          tip = 'Look for ways to reduce transportation costs, like carpooling or using public transit.';
          break;
        case 'Entertainment':
          tip = 'Consider finding free or low-cost entertainment options, or limit subscription services.';
          break;
        case 'Clothing':
          tip = 'Try shopping during sales or at thrift stores to save on clothing expenses.';
          break;
        case 'Personal':
          tip = 'Reduce personal care costs by switching to affordable alternatives or DIY solutions.';
          break;
        case 'Misc':
          tip = 'Review miscellaneous expenses and cut back on non-essential items where possible.';
          break;
        default:
          tip = `Look for ways to reduce spending in the ${category} category.`;
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
