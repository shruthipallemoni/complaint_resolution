import nodemailer from 'nodemailer';

export async function send_email(to: string, body: string): Promise<string> {
  const from = process.env.GMAIL_ADDRESS;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!from || !password) {
    throw new Error('GMAIL_ADDRESS and GMAIL_APP_PASSWORD must be configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: from, pass: password },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Regarding your complaint',
    text: body,
  });

  return `Email sent successfully to ${to}`;
}
