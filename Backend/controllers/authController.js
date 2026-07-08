import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock user for testing without a DB
// In a real application, fetch from MongoDB using Mongoose
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    role: 'student',
    // bcrypt hash for "password123"
    passwordHash: '$2b$10$sGO43GHtoZ4Hwg2jRlBTbudYjUptcWIzfmnUOk./tJFxk/e.KS8K6'
  },
  {
    id: '2',
    username: 'teacher',
    role: 'teacher',
    // bcrypt hash for "password123"
    passwordHash: '$2b$10$sGO43GHtoZ4Hwg2jRlBTbudYjUptcWIzfmnUOk./tJFxk/e.KS8K6'
  }
];

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = mockUsers.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
