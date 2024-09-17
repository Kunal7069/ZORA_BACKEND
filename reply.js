const express = require('express');
const imaps = require('imap-simple');
const nodemailer = require('nodemailer');

const cors = require("cors");
const app = express();
const port = 3000;
app.use(
    cors({
      origin: "*", // Your frontend URL
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    })
  );
app.use(express.json());

// Gmail IMAP and SMTP credentials
const config = {
    imap: {
        user: email,
        password: password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false } 
    }
};

// Function to send a reply to the fetched email
async function sendReplyEmail(toEmail, originalSubject, message, email,password) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass:password,  // You need to generate an app-specific password for Gmail
        },
    });

    const mailOptions = {
        from: email,
        to: toEmail,
        subject: 'RE: ' + originalSubject,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reply sent successfully to:', toEmail);
    } catch (err) {
        console.error('Error sending reply:', err);
    }
}

// Route to fetch the latest email and send a reply
app.post('/reply', async (req, res) => {
    const { toEmail, originalSubject, message, email,password } = req.body;

    if (!toEmail || !originalSubject || !message) {
        return res.status(400).send('Missing required fields');
    }

    try {
        await sendReplyEmail(toEmail, originalSubject, message, email,password);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).send('Error sending reply: ' + err.message);
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
