

'use strict';

const nodemailer = require('nodemailer');

// ── Transporter ────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // In development, use Ethereal (fake SMTP for testing)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER?.includes('@gmail')) {
    return null; // will use test account below
  }

  transporter = nodemailer.createTransport({
    host  : process.env.EMAIL_HOST || 'smtp.gmail.com',
    port  : parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth  : {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
}

// ── Admin notification email ────────────────────────────────
async function sendContactEmail(contact) {
  const t = getTransporter();
  if (!t) {
    console.log('📧 [DEV] Email notification skipped — no SMTP configured.');
    console.log('   From:', contact.name, '<' + contact.email + '>');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: #0D1117; padding: 32px; text-align: center; }
        .header h1 { color: #00E5C3; font-size: 1.5rem; margin: 0; font-family: monospace; }
        .header p { color: #8892A0; margin: 8px 0 0; font-size: 0.85rem; }
        .body { padding: 32px; }
        .field { margin-bottom: 20px; }
        .label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8892A0; margin-bottom: 4px; }
        .value { font-size: 0.95rem; color: #0D1117; padding: 12px; background: #f7f9fc; border-radius: 8px; border-left: 3px solid #00E5C3; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; background: rgba(0,229,195,0.1); color: #00B8A3; }
        .footer { background: #f7f9fc; padding: 20px 32px; text-align: center; font-size: 0.75rem; color: #8892A0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>{AO} Portfolio</h1>
          <p>New contact form submission</p>
        </div>
        <div class="body">
          <div class="field">
            <div class="label">From</div>
            <div class="value"><strong>${contact.name}</strong></div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value">${contact.email}</div>
          </div>
          ${contact.phone ? `<div class="field"><div class="label">Phone</div><div class="value">${contact.phone}</div></div>` : ''}
          ${contact.projectType ? `<div class="field"><div class="label">Project Type</div><div class="value"><span class="badge">${contact.projectType}</span></div></div>` : ''}
          ${contact.budget ? `<div class="field"><div class="label">Budget</div><div class="value">${contact.budget}</div></div>` : ''}
          <div class="field">
            <div class="label">Message</div>
            <div class="value">${contact.message.replace(/\n/g, '<br>')}</div>
          </div>
          ${contact.collaboration ? `<div class="field"><div class="label">Collaboration</div><div class="value">✅ Interested in long-term collaboration</div></div>` : ''}
        </div>
        <div class="footer">
          Received ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })} · Portfolio API
        </div>
      </div>
    </body>
    </html>
  `;

  await t.sendMail({
    from   : process.env.EMAIL_FROM,
    to     : process.env.CONTACT_RECIPIENT || process.env.EMAIL_USER,
    subject: `📬 New Portfolio Message from ${contact.name}`,
    html,
    replyTo: contact.email,
  });
}

// ── Auto-reply to sender ────────────────────────────────────
async function sendAutoReply(contact) {
  const t = getTransporter();
  if (!t) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
        .wrapper { max-width: 580px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0D1117 0%, #141B24 100%); padding: 40px 32px; text-align: center; }
        .logo { font-family: monospace; font-size: 2rem; color: #00E5C3; margin-bottom: 12px; }
        .header h1 { color: #F0F4F8; font-size: 1.2rem; margin: 0; font-weight: 600; }
        .body { padding: 36px 32px; }
        .body p { color: #4A5568; font-size: 0.95rem; line-height: 1.75; margin-bottom: 16px; }
        .highlight { color: #00B8A3; font-weight: 600; }
        .cta { display: inline-block; margin-top: 8px; padding: 12px 24px; background: #00E5C3; color: #000; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.875rem; }
        .footer { padding: 24px 32px; background: #f7f9fc; border-top: 1px solid #E2E8F0; text-align: center; font-size: 0.75rem; color: #A0AEC0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo">{AO}</div>
          <h1>Message received, ${contact.name.split(' ')[0]}!</h1>
        </div>
        <div class="body">
          <p>Thanks for reaching out! I've received your message and will get back to you within <span class="highlight">24–48 hours</span>.</p>
          <p>Here's a summary of what you sent:</p>
          <p>
            <strong>Project type:</strong> ${contact.projectType || 'General inquiry'}<br>
            <strong>Budget range:</strong> ${contact.budget || 'Not specified'}<br>
            <strong>Message preview:</strong> "${contact.message.slice(0, 120)}${contact.message.length > 120 ? '...' : ''}"
          </p>
          <p>While you wait, feel free to explore my work or connect with me on LinkedIn.</p>
          <a href="https://linkedin.com" class="cta">View LinkedIn Profile →</a>
        </div>
        <div class="footer">
          Alex Oduya — Backend Engineer · Nairobi, Kenya<br>
          This is an automated reply. Please don't respond to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  await t.sendMail({
    from   : process.env.EMAIL_FROM,
    to     : contact.email,
    subject: `Thanks for reaching out, ${contact.name.split(' ')[0]}! 👋`,
    html,
  });
}

module.exports = { sendContactEmail, sendAutoReply };