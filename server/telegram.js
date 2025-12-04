const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

const sendTelegramNotification = async (message) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram not configured - skipping notification');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✓ Telegram notification sent');
    } else {
      console.error('✗ Telegram notification failed:', data.description);
    }
  } catch (error) {
    console.error('✗ Telegram notification error:', error.message);
  }
};

const notifyNewUser = async (user) => {
  const message = `
🆕 <b>Yeni İstifadəçi Qeydiyyatı</b>

👤 <b>Ad Soyad:</b> ${user.name} ${user.lastname}
📧 <b>Email:</b> ${user.email}
📱 <b>Telefon:</b> ${user.phone}
💰 <b>İlkin Balans:</b> ${user.tokenBalance || 20} token
🕐 <b>Tarix:</b> ${new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
  `.trim();

  await sendTelegramNotification(message);
};

module.exports = { sendTelegramNotification, notifyNewUser };

