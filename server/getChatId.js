// Helper script to get your Telegram Chat ID
const fetch = require('node-fetch');

const BOT_TOKEN = '8585396025:AAFG_2c0GR4_rz-8nTz0_5Opco9KM1mJtes';

async function getChatId() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (data.ok && data.result.length > 0) {
      console.log('\n✓ Found messages!\n');
      data.result.forEach((update, index) => {
        console.log(`Message ${index + 1}:`);
        console.log('  Chat ID:', update.message.chat.id);
        console.log('  From:', update.message.from.first_name);
        console.log('  Message:', update.message.text);
        console.log('');
      });
      
      console.log('\nUse this Chat ID in your .env file:');
      console.log(`TELEGRAM_CHAT_ID=${data.result[0].message.chat.id}`);
    } else {
      console.log('No messages found. Please send a message to your bot first.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getChatId();

