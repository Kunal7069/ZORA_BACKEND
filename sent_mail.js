const imaps = require('imap-simple');

// Gmail IMAP credentials
const config = {
    imap: {
        user: 'jaink987654321@gmail.com', // your email
        password: 'ervs hpiv zlmn udcf', // your app password
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
    }
};

// Function to fetch all sent emails
async function fetchSentEmails() {
    try {
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
            const headerPart = msg.parts.filter(part => part.which === 'HEADER')[0].body;
            const subject = headerPart.subject ? headerPart.subject[0] : '(No Subject)';
            const to = headerPart.to ? headerPart.to[0] : '(No Recipient)';
            const date = headerPart.date[0];

            console.log(`Email #${index + 1}`);
            console.log(`Subject: ${subject}`);
            console.log(`To: ${to}`);
            console.log(`Date: ${date}`);
            console.log('--------------------------');
        });

    } catch (err) {
        console.error('Error fetching sent emails:', err);
    }
}

fetchSentEmails();
