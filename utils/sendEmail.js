const nodemailer = require("nodemailer");

const sendEmail = async (payload) => {
  const { email, subject, html } = payload;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "p-blog@p-blog.online",
    to: email,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Check your email for the password reset link",
    };
  } catch (error) {
    
    return {
      success: false,
      message: error.message || "Failed to send email, try again",
    };
  }
};

module.exports = sendEmail;
