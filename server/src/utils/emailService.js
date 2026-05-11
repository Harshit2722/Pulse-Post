const nodemailer = require('nodemailer');

let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Pulse-Post" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your Pulse-Post Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                <h1 style="color: #2C3330;">Welcome to Pulse-Post</h1>
                <p style="color: #707774; font-size: 16px;">Use the following code to verify your account. This code expires in 10 minutes.</p>
                <div style="background-color: #F8F7F4; border: 1px solid #E8E4DF; padding: 20px; border-radius: 10px; margin: 30px 0;">
                    <h2 style="font-size: 32px; letter-spacing: 5px; color: #526D62; margin: 0;">${otp}</h2>
                </div>
                <p style="color: #707774; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `
    };

    try {
        if (transporter) {
            await transporter.sendMail(mailOptions);
            console.log("OTP email sent successfully");
        } else {
            console.log("====================================");
            console.log(`[DEVELOPMENT MODE] OTP for ${email}: ${otp}`);
            console.log("====================================");
        }
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send verification email");
    }
};

const sendForgotPasswordOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Pulse-Post" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your Pulse-Post Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                <h1 style="color: #2C3330;">Password Reset Request</h1>
                <p style="color: #707774; font-size: 16px;">Use the following code to reset your password. This code expires in 10 minutes.</p>
                <div style="background-color: #F8F7F4; border: 1px solid #E8E4DF; padding: 20px; border-radius: 10px; margin: 30px 0;">
                    <h2 style="font-size: 32px; letter-spacing: 5px; color: #526D62; margin: 0;">${otp}</h2>
                </div>
                <p style="color: #707774; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
            </div>
        `
    };

    try {
        if (transporter) {
            await transporter.sendMail(mailOptions);
            console.log("Forgot password OTP email sent successfully");
        } else {
            console.log("====================================");
            console.log(`[DEVELOPMENT MODE] Reset OTP for ${email}: ${otp}`);
            console.log("====================================");
        }
    } catch (error) {
        console.error("Error sending Reset OTP email:", error);
        throw new Error("Failed to send password reset email");
    }
};

module.exports = { sendOTP, sendForgotPasswordOTP };
