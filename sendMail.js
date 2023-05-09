const nodemailer = require('nodemailer');

function sendMail(from, to, subject, text) {
  // create a transporter object using SMTP
  let transporter = nodemailer.createTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
          user: '*****',
          pass: '******'
      }
  });

  // create the email message
  let mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: text
  };

  // send the email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log(error);
      } else {
          console.log('Email sent: ' + info.response);
      }
  });
}

module.exports = sendMail;