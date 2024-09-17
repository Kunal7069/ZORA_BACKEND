const express = require("express");
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


// Gmail IMAP credentials
const config = {
    imap: {
        user: 'jaink987654321@gmail.com',
        password: 'ervs hpiv zlmn udcf',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    }
};

// Helper function to extract plain text from the raw message body
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
    
    return 'No plain text available';
}

// Function to format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const formattedDate = date.toLocaleDateString('en-US', optionsDate);
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    return { formattedDate, formattedTime, dayName };
}

// Function to fetch all emails
async function fetchAllEmails(req,res) {
    const emails=[]
    try {
        const connection = await imaps.connect({ imap: config.imap });
        await connection.openBox('INBOX');

        // Search for all emails within the past 7 days
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 7); // Fetch emails from the past 7 days

        const searchCriteria = [['SINCE', sinceDate]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'], 
            markSeen: false, // Set this to false if you don't want to mark emails as read
            struct: true,  // Fetch structure of the email
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log("No new emails found.");
            return null;
        }

        // Sort messages by date to ensure the latest email is retrieved first
        messages.sort((a, b) => {
            const dateA = new Date(a.parts.filter(part => part.which === 'HEADER')[0].body.date[0]);
            const dateB = new Date(b.parts.filter(part => part.which === 'HEADER')[0].body.date[0]);
            return dateB - dateA;  // Sort in descending order to get the latest email first
        });

        // Loop through and print details of each email
        for (const message of messages) {
            const headerPart = message.parts.filter(part => part.which === 'HEADER')[0].body;
            const subject = headerPart.subject[0];
            const from = headerPart.from[0];
            const date = headerPart.date[0];

            const { formattedDate, formattedTime, dayName } = formatDate(date);

            const bodyPart = message.parts.find(part => part.which === 'TEXT');
            let rawBody = bodyPart ? bodyPart.body : '';

            const plainText = extractPlainText(rawBody);

            const isRead = message.attributes.flags.includes('\\Seen') ? 'Read' : 'Unread';
            // Print the email details
            // console.log('from:', from);
            // console.log('subject:', subject);
            // console.log('date:', `${formattedDate}`);
            // console.log('day:', `${dayName}`);
            // console.log('time:', `${formattedTime}`);
            // console.log('cleanText:', plainText);
            // console.log('readStatus:', isRead);
            emails.push({
                from,
                subject,
                formattedDate, // or use customFormattedDate for "DD-MM-YYYY"
                dayName,
                formattedTime,
                plainText,
                readStatus: isRead,
              });
            // console.log('-------------------------------------');
        }
        console.log(emails)
        res.json(emails);
    } catch (err) {
        console.error('Error fetching emails:', err);
        return null;
    }
}


app.get("/fetch-emails", fetchAllEmails);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
