const imaps = require('imap-simple');
const nodemailer = require('nodemailer');

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

// Function to fetch the latest email
async function fetchLatestEmail() {
    try {
        const connection = await imaps.connect({ imap: config.imap });

        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN', ['SINCE', new Date()]];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log("No new emails.");
            return null;
        }

        const latestEmail = messages[messages.length - 1];
        
        const subject = latestEmail.parts.filter(part => part.which === 'HEADER')[0].body.subject[0];
        const from = latestEmail.parts.filter(part => part.which === 'HEADER')[0].body.from[0];

        console.log('Latest email subject:', subject);
        console.log('Latest email from:', from);

        return { subject, from };
    } catch (err) {
        console.error('Error fetching email:', err);
        return null;
    }
}

// Function to send a reply to the fetched email
async function sendReplyEmail(toEmail, originalSubject) {
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
        text: 'ITS GOOD TO HEAR',
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reply sent successfully to:', toEmail);
    } catch (err) {
        console.error('Error sending reply:', err);
    }
}

// Main function to fetch the latest email and send a reply
async function fetchAndReply() {
   
        await sendReplyEmail("kunal jain <jaink7069@gmail.com>", "Testing Zora");

}

// Run the process
fetchAndReply();
