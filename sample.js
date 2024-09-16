const fetchEmails = (req, res) => {
    const imap = new Imap(imapConfig);
  
    const openInbox = (callback) => {
      imap.openBox("INBOX", false, callback);
    };
  
    imap.connect();
  
    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) {
          return res.status(500).json({ error: "Error opening inbox", details: err });
        }
  
        // Search and fetch multiple emails
        imap.search(["ALL"], (err, results) => {
          if (err) {
            return res.status(500).json({ error: "Error searching emails", details: err });
          }
  
          // Specify how many emails you want to fetch (e.g., last 10 emails)
          const emailIds = results.reverse().slice(10, 17);
  
          if (emailIds.length === 0) {
            imap.end();
            return res.json({ message: "No emails found" });
          }
  
          const fetch = imap.fetch(emailIds, {
            bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)", "TEXT"],
          });
  
          const emails = []; // Array to store all the email data
  
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
                  const fromLine = lines.find((line) =>
                    line.startsWith("From:")
                  );
  
                  if (dateLine) {
                    const rawDate = dateLine.replace("Date: ", "").trim();
                    const dateObject = new Date(rawDate);
                    const subject = subjectLine
                      .replace("Subject: ", "")
                      .trim();
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
  
                    const parsed = await simpleParser(buffer);
  
                    let cleanText = "";
                    if (parsed.text) {
                      cleanText = parsed.text
                        .replace(/<[^>]*>/g, "") // Remove HTML tags
                        .replace(/&[a-z]+;/g, ""); // Remove HTML entities
                    }
  
                    // Push the current email data into the emails array
                    emails.push({
                      from,
                      subject,
                      day,
                      date,
                      time,
                    //   body: cleanText || "Body not available",
                      readStatus: isRead ? "Read" : "Unread",
                    });
                  }
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
            // Send the entire array of emails as a single response
            res.json(emails);
          });
        });
      });
    });
  
    imap.once("error", (err) => {
      console.error("IMAP Error:", err);
      res.status(500).json({ error: "IMAP Error", details: err });
    });
  
    imap.once("end", () => {
      console.log("Connection ended");
    });
  };