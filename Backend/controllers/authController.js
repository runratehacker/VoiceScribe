import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import supabase from '../supabase.js';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    let role = "student";
    let { error, data } = await supabase.from("STUDENT").select("id, Username, Password").eq("Username", username).single();

    if (error) {
      ({ error, data } = await supabase.from("TEACHER").select("id, Username, Password").eq("Username", username).single());
      role = "teacher";
    }

    if (error || !data) {
      console.log("error : " + error)
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (password !== data.Password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, username: data.Username, role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: data.id,
        username: data.Username,
        role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export default login;
