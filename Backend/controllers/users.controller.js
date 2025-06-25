const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = db.users;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 2️⃣ Find user by email
    const user = await Users.findOne({ where: { email } });
    if (!user) {
      console.log('❌ Login failed: User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ Login failed: Incorrect password for', email);
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 4️⃣ Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for', email);
    return res.status(200).json({ userId: user.id, token });

  } catch (err) {
    console.error('🔥 Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
