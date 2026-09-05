// Migrated from commands/dare.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

async function dareCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://truth-dare-api.officialhectormanuel.workers.dev/?type=dare`);
        
        if (!res.ok) throw await res.text();
        
        const json = await res.json();
        const dareMessage = json?.game?.question || "Couldn't fetch a dare right now.";

        await sock.sendMessage(chatId, { text: dareMessage });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, { text: getLang(sock).dare_error });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['dare'],
  description: 'Get a dare challenge',
  category: 'games',
}, async (sock, chatId, message) => {
  await dareCommand(sock, chatId, message);
});