
import { Asset, BiasOutput } from '../types';

export const sendIntelligenceReport = async (biases: Record<Asset, BiasOutput>): Promise<boolean> => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram configuration (TOKEN/ID) missing in environment. Report suppressed.");
    return false;
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: false }) + ' UTC';
  
  let message = `🏢 *INSTITUTIONAL COMMODITY BRIEF*\n`;
  message += `🕒 _${timestamp}_\n\n`;

  Object.values(Asset).forEach(asset => {
    const data = biases[asset];
    if (!data) return;

    const emoji = data.horizons.intraday.bias === 'BULLISH' ? '🟢' : 
                  data.horizons.intraday.bias === 'BEARISH' ? '🔴' : '⚪️';

    message += `${emoji} *${asset} ANALYTICS*\n`;
    message += `┣ *Scalp:* ${data.horizons.scalping.bias} (${(data.horizons.scalping.confidence * 100).toFixed(0)}%)\n`;
    message += `┣ *Intraday:* ${data.horizons.intraday.bias} (${(data.horizons.intraday.confidence * 100).toFixed(0)}%)\n`;
    message += `┗ *Swing:* ${data.horizons.swing.bias} (${(data.horizons.swing.confidence * 100).toFixed(0)}%)\n\n`;
    
    message += `📍 *Catalyst:* ${data.horizons.intraday.driver}\n\n`;
    
    message += `🔍 *Key Drivers:*\n`;
    data.key_drivers.slice(0, 2).forEach(kd => message += `• ${kd}\n`);
    message += `\n───────────────────\n\n`;
  });

  message += `⚠️ _Grounded Bias Engine v1.7.2_`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    return response.ok;
  } catch (error) {
    console.error("Telegram Transmission Error:", error);
    return false;
  }
};
