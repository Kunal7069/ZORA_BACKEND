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

const fetchEmails = () => {
  
  imap.connect();

  imap.once("ready", () => {
    openInbox((err, box) => {
      if (err) throw err;

      imap.search(["ALL"], (err, results) => {
        if (err) throw err;

        const emailIds = results.reverse().slice(0,4);

        if (emailIds.length === 0) {
          console.log("No emails found.");
          imap.end();
          return;
        }

        const fetch = imap.fetch(emailIds, {
          bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)", "TEXT"],
        });

        fetch.on("message", (msg, seqno) => {
          let buffer = "";
          let isRead = false;
          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", async () => {
              try {
                const lines = buffer.split("\n");

                const dateLine = lines.find((line) => line.startsWith("Date:"));
                const subjectLine = lines.find((line) =>
                  line.startsWith("Subject:")
                );
                const fromLine = lines.find((line) => line.startsWith("From:"));

                if (dateLine) {
                  const rawDate = dateLine.replace("Date: ", "").trim();
                  const dateObject = new Date(rawDate);
                  const subject = subjectLine.replace("Subject: ", "").trim();
                  const from = fromLine.replace("From: ", "").trim();
                  const day = dateObject.toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  const date = dateObject.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  const time = dateObject.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  console.log("From:", from);
                  console.log("Subject:", subject);
                  console.log("Day:", day);
                  console.log("Date:", date);
                  console.log("Time:", time);
                  console.log("Read Status:", isRead ? "Read" : "Unread");
                }
                const parsed = await simpleParser(buffer);

                // if (parsed.text) {
                //   const cleanText = parsed.text
                //     .replace(/<[^>]*>/g, "") // Remove HTML tags
                //     .replace(/&[a-z]+;/g, ""); // Remove HTML entities like &nbsp;

                //   console.log("Body (Clean Text):", cleanText);
                // } else {
                //   console.log("Body: Not available");
                // }
                
                console.log("--------------------------");
              } catch (err) {
                console.error("Error parsing email:", err);
              }
            });
          });
          msg.once("attributes", (attrs) => {
            if (attrs.flags.includes("\\Seen")) {
              isRead = true;
            }
          });
        });

        fetch.once("end", () => {
          imap.end();
        });
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

fetchEmails();
