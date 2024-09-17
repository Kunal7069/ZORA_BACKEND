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
        user: 'jaink987654321@gmail.com',
        password: 'ervs hpiv zlmn udcf',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false } 
    }
};

// Function to send a reply to the fetched email
async function sendReplyEmail(toEmail, originalSubject, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jaink987654321@gmail.com',
            pass: 'ervs hpiv zlmn udcf',  // You need to generate an app-specific password for Gmail
        },
    });

    const mailOptions = {
        from: 'jaink987654321@gmail.com',
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
    const { toEmail, originalSubject, message } = req.body;

    if (!toEmail || !originalSubject || !message) {
        return res.status(400).send('Missing required fields');
    }

    try {
        await sendReplyEmail(toEmail, originalSubject, message);
        res.send('Reply sent successfully!');
    } catch (err) {
        res.status(500).send('Error sending reply: ' + err.message);
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
