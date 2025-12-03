const { db, admin } = require('./firebase');
const bcrypt = require('bcrypt');

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'tokenTransactions';

// User model functions
const User = {
  create: async (email, phone, password, name, lastname) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userData = {
      email,
      phone,
      password: hashedPassword,
      name,
      lastname,
      tokenBalance: 20,
      isAdmin: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Check if email or phone already exists
    const emailSnapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!emailSnapshot.empty) {
      throw new Error('Email already registered');
    }

    const phoneSnapshot = await db.collection(USERS_COLLECTION)
      .where('phone', '==', phone)
      .limit(1)
      .get();
    
    if (!phoneSnapshot.empty) {
      throw new Error('Phone number already registered');
    }

    const docRef = await db.collection(USERS_COLLECTION).add(userData);
    const userId = docRef.id;
    
    // Create initial token transaction
    await TokenTransaction.create(userId, 'initial', 20, 20, null);
    
    return { id: userId, ...userData };
  },

  findByEmail: async (email) => {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  findByPhone: async (phone) => {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('phone', '==', phone)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  findById: async (id) => {
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    // Remove password from response
    const { password, ...userData } = data;
    return { id: doc.id, ...userData };
  },

  verifyPassword: (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
  },

  getTokenBalance: async (userId) => {
    const user = await User.findById(userId);
    return user ? (user.tokenBalance || 0) : 0;
  },

  updateTokenBalance: async (userId, amount, type, adminId = null) => {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentBalance = userDoc.data().tokenBalance || 0;
    const newBalance = type === 'deduct' 
      ? Math.max(0, currentBalance - amount)
      : currentBalance + amount;

    await userRef.update({ tokenBalance: newBalance });
    
    // Create transaction record
    await TokenTransaction.create(userId, type, amount, newBalance, adminId);
    
    return newBalance;
  },

  getAllUsers: async () => {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const { password, ...userData } = data;
      return { id: doc.id, ...userData };
    });
  }
};

// Token Transaction functions
const TokenTransaction = {
  create: async (userId, type, amount, balanceAfter, adminId) => {
    const transactionData = {
      userId,
      type,
      amount,
      balanceAfter,
      adminId: adminId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      description: type === 'initial' ? 'Initial balance' : 
                   type === 'add' ? `Added by admin` : 
                   'Chat message'
    };

    await db.collection(TRANSACTIONS_COLLECTION).add(transactionData);
  },

  getByUserId: async (userId, ordered = true) => {
    let query = db.collection(TRANSACTIONS_COLLECTION)
      .where('userId', '==', userId);
    
    // Only add orderBy if needed (requires composite index)
    if (ordered) {
      query = query.orderBy('timestamp', 'desc');
    }
    
    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

module.exports = { User, TokenTransaction };
