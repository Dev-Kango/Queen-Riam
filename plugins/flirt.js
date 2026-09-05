// Migrated from commands/flirt.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

async function flirtCommand(sock, chatId, message) {
    try {
        const shizokeys = 'knightbot';
        const res = await fetch(`https://api.shizo.top/api/quote/flirt?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const flirtMessage = json.result;

        // Send the flirt message
        await sock.sendMessage(chatId, { text: flirtMessage });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).flirt_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['flirt'],
  description: 'Send a flirty message',
  category: 'fun',
}, async (sock, chatId, message) => {
  await flirtCommand(sock, chatId, message);
});