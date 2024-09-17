
const Imap = require("imap");
const { simpleParser } = require("mailparser");

const imap = new Imap({
    user: "jaink987654321@gmail.com",
    password: "ervs hpiv zlmn udcf",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

const openInbox = (callback) => {
  imap.openBox("INBOX", false, callback);
};

// Helper function to fetch emails by search criteria
const searchEmails = (criteria, callback) => {
  imap.search(criteria, (err, results) => {
    if (err) throw err;
    if (!results || results.length === 0) {
      console.log("No emails found for criteria:", criteria);
      callback([]);
    } else {
      const fetch = imap.fetch(results, {
        bodies: ["HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)", "TEXT"],
      });
      const emails = [];

      fetch.on("message", (msg, seqno) => {
        let buffer = "";

        msg.on("body", (stream) => {
          stream.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
          });

          stream.once("end", async () => {
            const parsed = await simpleParser(buffer);
            emails.push(parsed);
          });
        });
      });

      fetch.once("end", () => {
        callback(emails);
      });
    }
  });
};

const fetchEmailsAndReplies = () => {
  imap.connect();

  imap.once("ready", () => {
    openInbox(async (err, box) => {
      if (err) throw err;

      // First, fetch the latest 4 emails
      searchEmails(["ALL"], async (emails) => {
        const latestEmails = emails.reverse().slice(0, 2); // Get the latest 4 emails

        for (const email of latestEmails) {
        //   console.log("From:", email.from.text);
          console.log("Subject:", email);
        //   console.log("Message-ID:", email.messageId);
          console.log("--------------------------");

          // Now search for replies to the current email using In-Reply-To or References
          const searchCriteria = [
            ["HEADER", "IN-REPLY-TO", email.messageId], // Search for emails with In-Reply-To header matching current email's Message-ID
            ["HEADER", "REFERENCES", email.messageId]   // Search for emails that have the current email's Message-ID in References header
          ];

          searchEmails(searchCriteria, (replies) => {
            if (replies.length > 0) {
              console.log(`Found ${replies.length} replies to "${email.subject}":`);
              replies.forEach((reply, index) => {
                console.log(`Reply ${index + 1} from:`, reply.from.text);
                console.log(`Subject:`, reply.subject);
                console.log(`Date:`, reply.date);
                console.log("--------------------------");
              });
            } else {
              console.log(`No replies found for "${email.subject}".`);
            }
          });
        }
      });
    });
  });

  imap.once("error", (err) => {
    console.error("IMAP Error:", err);
  });

  imap.once("end", () => {
    console.log("Connection ended");
  });
};

fetchEmailsAndReplies();
