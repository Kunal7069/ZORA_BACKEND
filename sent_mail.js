const imaps = require('imap-simple');
const nodemailer = require('nodemailer');
const express = require("express");
const cors = require("cors");
const app = express();
const port = 4000;
app.use(
    cors({
      origin: "*", // Your frontend URL
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    })
  );
app.use(express.json());

// Gmail IMAP credentials


function extractPlainText(body) {
    const startMarker = 'Content-Type: text/plain; charset="UTF-8"';
    const endMarker = 'Content-Type: text/html; charset="UTF-8"';

    const startIndex = body.indexOf(startMarker);
    const endIndex = body.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        let plainText = body.substring(startIndex + startMarker.length, endIndex).trim();
        plainText = plainText.replace(/--.*\r?\n/g, '').replace(/Content-Transfer-Encoding.*/g, '').trim();

        const lines = plainText.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 2) {
            lines.pop(); // Remove last line
            lines.pop(); // Remove one more line
        }

        return lines.join('\n').trim();
    }
    else if (startIndex == -1 && endIndex == -1){
        return body
    }
    return 'No plain text available';
}

// Function to format date and time
const formatDateTime = (dateString) => {
    const date = new Date(dateString);

    // Format date to "September 16, 2024"
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);

    // Format time to "19:00:37"
    const formattedTime = date.toTimeString().split(' ')[0];

    return { formattedDate: formattedDate, formattedTime: formattedTime };
};

// Function to fetch all sent emails
async function fetchSentEmails(req,res,email,password) {
    const replies=[]
    try {
        const config = {
            imap: {
                user: email, // your email
                password: password, // your app password
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                authTimeout: 3000,
                tlsOptions: { rejectUnauthorized: false }
            }
        };
        // Connect to IMAP server
        const connection = await imaps.connect({ imap: config.imap });

        // Open the "Sent Mail" folder
        await connection.openBox('[Gmail]/Sent Mail'); // For Gmail, use [Gmail]/Sent Mail

        // Fetch all emails in the Sent Mail folder
        const searchCriteria = ['ALL'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };

        const sentMessages = await connection.search(searchCriteria, fetchOptions);

        if (sentMessages.length === 0) {
            console.log("No sent emails found.");
            return;
        }

        // Loop through and print details of each sent email
        sentMessages.forEach((msg, index) => {
            const headerPart = msg.parts.find(part => part.which === 'HEADER').body;
            const subject = headerPart.subject ? headerPart.subject[0] : '(No Subject)';
            const to = headerPart.to ? headerPart.to[0] : '(No Recipient)';
            const { formattedDate, formattedTime } = formatDateTime(headerPart.date[0]);

            // Extract the body part
            const bodyPart = msg.parts.find(part => part.which === 'TEXT');
            const plainText_1 = bodyPart ? bodyPart.body : '(No Body)';
            const plainText = extractPlainText(plainText_1);
            replies.push({
                to,
                subject,
                formattedDate, 
                formattedTime,
                plainText
              });
        });
        console.log("REPLIES",replies)
        res.json(replies);
        // Close the connection
        await connection.end();

    } catch (err) {
        console.error('Error fetching sent emails:', err);
    }
}


app.post('/fetch-sent-emails',  async (req, res) => {
    const { email,password } = req.body;
    console.log(email,password)
    fetchSentEmails(req,res,email,password);
    
});
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
