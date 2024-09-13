const Imap = require("imap");
const { simpleParser } = require("mailparser");

const imap = new Imap({
  user: "jaink987654321@gmail.com",
  password: "ervs hpiv zlmn udcf",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
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

        const emailIds = results.reverse().slice(3, 4);

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

                const lastThreeLines = lines.slice(-5).join("\n");

                console.log("Last Three Lines:");
                console.log(lastThreeLines);
                const parsed = await simpleParser(buffer);

                if (parsed.text) {
                  console.log("Body:", parsed.text);
                } else if (parsed.textAsHtml) {
                  console.log("Body (HTML):", parsed.textAsHtml);
                } else {
                  console.log("Body: Not available");
                }
                console.log("Read Status:", isRead ? "Read" : "Unread");
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
