import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import supabase from '../supabase.js';
import { Resend } from "resend";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const resend = new Resend(process.env.RESEND_API_KEY);


const login = async (req, res) => {

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    let role = "student";
    let { error, data } = await supabase.from("STUDENT").select("id, username, password").eq("username", username).single();

    if (error) {
      ({ error, data } = await supabase.from("TEACHER").select("id, username, password").eq("username", username).single());
      role = "teacher";
    }

    if (error || !data) {
      console.log("error : " + error)
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (password !== data.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, username: data.username, role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: data.id,
        username: data.username,
        role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const sendOTP = async (req, res) => {

  try {

    const { username } = req.body;

    let { error, data } = await supabase.from("STUDENT").select("email").eq("username", username).single();

    if (error) {
      ({ error, data } = await supabase.from("TEACHER").select("email").eq("username", username).single());
    }

    if (error || !data) {

      console.log("error : " + error)
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const emailAddress = data.email;

    const otpCode = Math.floor(1000 + Math.random() * 9000);


    const sendEmail = async (otp) => {

      try {

        const templatePath = path.join(dirname, '..', 'template', 'otpEmail.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        const htmlContent = htmlTemplate.replaceAll('{{OTP}}', String(otp));

        const { data, error } = await resend.emails.send({

          from: 'VoiceScribe <voicescribe44@resend.dev>',
          to: [emailAddress],
          subject: 'Reset your VoiceScribe password',
          html: htmlContent,

        })

        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Error in sending mail' });
        }

      } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to send OTP' });
      }
    }

    await sendEmail(otpCode);

    const { data: saveData, error: saveError } = await supabase.from("PASSWORD_RESET_OTP").insert({

      username,
      otp: otpCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      is_used: false,

    }).select("id").single();



    if (saveError) {
      console.log(saveError);
      return res.status(500).json({ message: 'Failed to save OTP in database' });
    }

    const id = saveData.id;

    return res.status(200).json({ message: 'OTP sent successfully', id: id });

  }
  catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error during sendOTP' });
  }

}


const verifyOTP = async (req, res) => {

  try {

    const { username, OTP, id } = req.body;

    const { data, error } = await supabase.from("PASSWORD_RESET_OTP").select("otp", "expires_at", "is_used").eq("id", id).eq("username", username).single();

    if (error) {
      console.log(error);
      return res.status(401).json({ message: 'Failed to fetch OTP from the database to verify' });
    }

    const otp = data.otp;
    const is_used = data.is_used;
    const expires_at = data.expires_at;

    if (new Date(expires_at) < new Date()) {
      return res.status(401).json({ message: 'OTP has expired' });
    }

    if (OTP != otp) {
      return res.status(401).json({ message: 'OTP is incorrect' });
    }

    if (is_used) {
      return res.status(401).json({ message: 'OTP has already been used' });
    }

    const { data: updateData, error: updateError } = await supabase.from("PASSWORD_RESET_OTP").update({ is_used: true }).eq("id", id);

    if (updateError) {
      console.log(updateError);
      return res.status(500).json({ message: 'Failed to update OTP status' });
    }

    const resetToken = jwt.sign(
      { username: username, OTP: OTP },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.status(200).json({ message: 'OTP verified successfully', resetToken });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error while verify OTP' });
  }


}


const resetPassword = async (req, res) => {

  try {

    const { username, password, resetToken } = req.body;

    if (!resetToken) {
      return res.status(401).json({ message: 'Reset token is required' });
    }

    if (!username || !password) {
      return res.status(401).json({ message: 'Username and password are required' });
    }

    let role = "student";
    let { error, data } = await supabase.from("STUDENT").select("id, username, password").eq("username", username).single();

    if (error) {
      ({ error, data } = await supabase.from("TEACHER").select("id, username, password").eq("username", username).single());
      role = "teacher";
    }

    if (error || !data) {
      console.log(error)
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let decoded;

    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    } catch (err) {
      return res.status(401).json({ message: 'Reset token has expired or is invalid' });
    }

    if (decoded.username != username) {
      return res.status(500).json({ message: 'Invalid token' });
    }

    const passworddatabase = data.password;

    if (password === passworddatabase) {
      return res.status(400).json({ message: 'new password and old password cannot be same' })
    }

    const { data: updateData, error: updateError } = await supabase.from(role.toUpperCase()).update({ password: password }).eq("username", username);

    if (updateError) {
      console.log(updateError);
      return res.status(500).json({ message: 'Failed to update password' })
    }

    return res.status(200).json({ message: 'Password reset successfully' })


  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error while reset password' });
  }

}

export { login, sendOTP, verifyOTP, resetPassword };
