const { User } = require('../db');

const checkTokenBalance = async (req, res, next) => {
  try {
    const userId = req.userId;
    const balance = await User.getTokenBalance(userId);

    if (balance <= 0) {
      return res.status(403).json({ 
        error: 'Balansınız bitib. Xidmət üçün müştəri xidməti ilə əlaqə saxlayın: support@yoldash.live',
        balance: 0,
        supportEmail: 'support@yoldash.live'
      });
    }

    // Store balance in request for later use
    req.tokenBalance = balance;
    next();
  } catch (error) {
    console.error('Token check error:', error);
    res.status(500).json({ error: 'Token balance check failed' });
  }
};

const deductToken = async (userId) => {
  try {
    await User.updateTokenBalance(userId, 1, 'deduct');
  } catch (error) {
    console.error('Token deduction error:', error);
    throw error;
  }
};

module.exports = { checkTokenBalance, deductToken };

