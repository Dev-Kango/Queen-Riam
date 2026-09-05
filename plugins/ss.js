// Migrated from commands/ss.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: getLang(sock).ss_usage,
            quoted: message
        });
        return;
    }

    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Extract URL from command
        const url = match.trim();
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: getLang(sock).ss_no_url,
                quoted: message
            });
        }

        // Call the API
        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { 'accept': '*/*' } });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // Send the screenshot
        await sock.sendMessage(chatId, {
            image: imageBuffer,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in ss command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).ss_failed,
            quoted: message
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['ss'],
  description: 'Screenshot a website',
  category: 'tools',
}, async (sock, chatId, message, args, query) => {
  await handleSsCommand(sock, chatId, message, query);
});