// Migrated from commands/truth.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

async function truthCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://truth-dare-api.officialhectormanuel.workers.dev/?type=truth`);
        
        if (!res.ok) throw await res.text();
        
        const json = await res.json();
        const truthMessage = json?.game?.question || "Couldn't fetch a truth right now.";

        await sock.sendMessage(chatId, { text: truthMessage });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).truth_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['truth'],
  description: 'Get a truth question',
  category: 'games',
}, async (sock, chatId, message) => {
  await truthCommand(sock, chatId, message);
});