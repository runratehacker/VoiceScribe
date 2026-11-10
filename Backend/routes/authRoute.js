import express from 'express';
import { login, sendOTP, resetPassword, verifyOTP } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/sendotp', sendOTP);
router.post('/verifyotp', verifyOTP);
router.post('/resetpassword', resetPassword);


export default router;
