const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jaink987654321@gmail.com',
    pass: 'ervs hpiv zlmn udcf'
  }
});

// Function to send an email
const sendEmail = (toEmail, subject, message) => {
  const mailOptions = {
    from: 'jaink987654321@gmail.com', 
    to: toEmail, 
    subject: subject, 
    text: message, 
    
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error occurred:', error);
    } else {
      console.log('Email sent successfully:', info.response);
    }
  });
};

sendEmail("jaink7069@gmail.com", "Application Selected For role of SDE 1", "YOU ARE SELECTED.");
