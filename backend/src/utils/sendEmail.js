import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Create a transporter using your environment variables
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Smart Career Chooser" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional: if you want to send a styled HTML email
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;