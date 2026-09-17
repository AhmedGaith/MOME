const nodemailer = require('nodemailer');

const transporter = (() => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('SMTP not configured. Skipping email notifications.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
})();

async function sendOrderConfirmation(order, items, userId) {
  if (!transporter) return;

  const { data: user } = userId
    ? await require('../db').getClient().from('users').select('name, email').eq('id', userId).single()
    : { data: null };

  const customerName = user?.name || order.shipping_full_name;
  const customerEmail = user?.email || '';

  const itemsList = items.map(i =>
    `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${Number(i.price).toFixed(2)}</td><td>$${(Number(i.price) * i.quantity).toFixed(2)}</td></tr>`
  ).join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
      <h1 style="color:#1a1a1a;">Order Confirmed</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order! Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
        <thead><tr style="background:#f0ede8;"><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${itemsList}</tbody>
        <tfoot><tr style="font-weight:bold;border-top:2px solid #1a1a1a;"><td colspan="3">Total</td><td>$${Number(order.total).toFixed(2)}</td></tr></tfoot>
      </table>
      <h3>Shipping to:</h3>
      <p>${order.shipping_full_name}<br>${order.shipping_address}<br>${order.shipping_city} ${order.shipping_zip}<br>${order.shipping_phone_number}</p>
      <p style="color:#666;font-size:14px;">You will receive another email when your order ships.</p>
      <p style="color:#666;font-size:12px;margin-top:2rem;">MOME — Wear Less. Choose Better.</p>
    </div>
  `;

  if (customerEmail) {
    await transporter.sendMail({
      from: `"MOME" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `MOME Order Confirmation #${order.id}`,
      html,
    });
  }

  console.log(`Order confirmation email sent for order #${order.id}`);
}

module.exports = { sendOrderConfirmation };
