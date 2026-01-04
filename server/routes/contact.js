const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// @route   POST api/contact
// @desc    Send contact email
// @access  Public
router.post('/', async (req, res) => {
    const { fullName, email, subject, message } = req.body;

    // Build email content
    const emailContent = `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
    `;

    try {
        // Create transporter (Note: User should configure SMTP in .env)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || email,
            to: 'suprajsth8@gmail.com',
            subject: `Contact Form: ${subject}`,
            html: emailContent,
            replyTo: email
        };

        // Note: In local dev without credentials, this will fail
        // If no credentials, we'll just log it
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- MOCKED EMAIL ---');
            console.log('To: suprajsth8@gmail.com');
            console.log('Subject:', mailOptions.subject);
            console.log('Content:', emailContent);
            console.log('---------------------');
            return res.status(200).json({ msg: 'Email submission recorded (Mocked - Email credentials missing)' });
        }

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Email sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ msg: 'Failed to send email', error: error.message });
    }
});

module.exports = router;
