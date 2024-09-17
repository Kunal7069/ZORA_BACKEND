const imaps = require('imap-simple');

// Gmail IMAP credentials
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

// Function to fetch all sent emails and their replies
async function fetchEmailsAndReplies() {
    try {
        // Connect to IMAP server
        const connection = await imaps.connect({ imap: config.imap });

        // Open the INBOX and fetch the latest email
        await connection.openBox('INBOX');
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 7); // Fetch emails from the past 7 days

        const searchCriteria = [['SINCE', sinceDate]];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };

        const messages = await connection.search(searchCriteria, fetchOptions);
        if (messages.length === 0) {
            console.log("No new emails found.");
            return;
        }

        // Sort and get the latest email
        messages.sort((a, b) => {
            const dateA = new Date(a.parts.filter(part => part.which === 'HEADER')[0].body.date[0]);
            const dateB = new Date(b.parts.filter(part => part.which === 'HEADER')[0].body.date[0]);
            return dateA - dateB;
        });

        const latestEmail = messages[messages.length - 1];
        const headerPart = latestEmail.parts.filter(part => part.which === 'HEADER')[0].body;
        const subject = headerPart.subject[0].replace('Re:', '').trim(); // Normalize subject
        const from = headerPart.from[0];
        const messageId = headerPart['message-id'][0]; // Unique message ID of the original email

        console.log('Latest email subject:', subject);
        console.log('Latest email from:', from);
        console.log('Message ID:', messageId);

        // Open the "Sent Mail" folder and search for replies based on the same subject
        await connection.openBox('[Gmail]/Sent Mail'); // Open Sent Mail folder

        const sentSearchCriteria = [
            ['HEADER', 'References', messageId], // Check if it references the original email
            ['HEADER', 'In-Reply-To', messageId] // Check if it replies to the original email
        ];
        const sentMessages = await connection.search(sentSearchCriteria, fetchOptions);

        if (sentMessages.length === 0) {
            console.log("No replies found in Sent Mail.");
        } else {
            console.log("Replies found in Sent Mail:");
            sentMessages.forEach((msg, index) => {
                const sentHeader = msg.parts.filter(part => part.which === 'HEADER')[0].body;
                const sentSubject = sentHeader.subject[0];
                const sentTo = sentHeader.to[0];
                const replyDate = sentHeader.date[0];
                const replyMessageId = sentHeader['message-id'][0]; // Get Message-ID of the reply

                console.log(`Reply #${index + 1}`);
                console.log(`Reply subject: ${sentSubject}`);
                console.log(`Sent to: ${sentTo}`);
                console.log(`Reply date: ${replyDate}`);
                console.log(`Reply Message-ID: ${replyMessageId}`);
                console.log("-----------------------");
            });
        }

    } catch (err) {
        console.error('Error fetching emails or replies:', err);
    }
}

fetchEmailsAndReplies();
