const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Generic mailer used by absence alerts, fee reminders, password resets, notices
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured - skipping email send. Set SMTP_USER/SMTP_PASS in .env");
    return { skipped: true };
  }

  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return info;
};

// Pre-built template for the parent absence alert described in the spec
const sendAbsenceAlert = async ({ parentEmail, studentName, date, reason }) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return sendEmail({
    to: parentEmail,
    subject: `Attendance Alert: ${studentName} was absent on ${formattedDate}`,
    html: `
      <p>Dear Parent,</p>
      <p>Your child <strong>${studentName}</strong> was absent on ${formattedDate}.</p>
      ${reason ? `<p><strong>Reason on file:</strong> ${reason}</p>` : ""}
      <p>Please contact the school for further information.</p>
      <p>Thank you.</p>
    `,
  });
};

module.exports = { sendEmail, sendAbsenceAlert };
