const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
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

app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jaink987654321@gmail.com",
    pass: "ervs hpiv zlmn udcf",
  },
});

// Function to send an email
const sendEmail = (toEmail, subject, message) => {
  const mailOptions = {
    from: "jaink987654321@gmail.com",
    to: toEmail,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};

app.post("/send_mail", (req, res) => {
  
  const { message,to } = req.body;
 
  sendEmail(to, "REPLY FOR YOUR MAIL", message);

  res.json({ status: "success" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
