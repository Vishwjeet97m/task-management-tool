import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  
  export const sendEmailNotification = async (to, subject, message) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message,
      };
  
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully to", to);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };