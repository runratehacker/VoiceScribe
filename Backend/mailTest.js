import { Resend } from "resend";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (otp) => {

    try {
        const templatePath = path.join(dirname, 'template', 'otpEmail.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        const htmlContent = htmlTemplate.replaceAll('{{OTP}}', String(otp));

        const { data, error } = await resend.emails.send({

            from: 'VoiceScribe <voicescribe44@resend.dev>',
            to: ['runratehacker@gmail.com'],
            subject: 'OTP for Password Reset',
            html: htmlContent,
        })

        if (error) {
            console.log(error);
        } else {
            console.log('Email sent successfully:', data);
        }

    } catch (error) {
        console.log(error);
    }

}

sendEmail('482910');